import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Ensure Homebrew-installed binaries are available to Node
process.env.PATH += ':/usr/local/bin:/opt/homebrew/bin';

// Serve static SVG files
app.use('/svg', express.static(path.join(__dirname, 'temp')));

app.post('/api/render-tikz', async (req, res) => {
  const tempDir = path.join(__dirname, 'temp');
  const filename = `tikz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const texFile = path.join(tempDir, `${filename}.tex`);
  const pdfFile = path.join(tempDir, `${filename}.pdf`);
  const svgFile = path.join(tempDir, `${filename}.svg`);

  try {
    const { tikzCode } = req.body;
    if (!tikzCode || typeof tikzCode !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid tikzCode.' });
    }

    // Create temp directory if needed
    await fs.mkdir(tempDir, { recursive: true });

    // Write minimal standalone LaTeX file
    const fullLatex = `
\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikzCode}
\\end{document}
`;
    await fs.writeFile(texFile, fullLatex);

    // Compile to PDF using pdflatex (no DVI step needed)
    await execAsync(`pdflatex -interaction=nonstopmode -halt-on-error -output-directory=${tempDir} ${texFile}`, {
      cwd: tempDir,
      timeout: 15000,
    });

    // Convert PDF → SVG
    await execAsync(`pdf2svg ${pdfFile} ${svgFile}`, {
      cwd: tempDir,
      timeout: 5000,
    });

    // Read and return SVG content
    const svgContent = await fs.readFile(svgFile, 'utf-8');

    // Cleanup extra files (keep .svg for static serving)
    const cleanupFiles = [
      texFile,
      pdfFile,
      path.join(tempDir, `${filename}.aux`),
      path.join(tempDir, `${filename}.log`),
    ];
    for (const f of cleanupFiles) {
      try { await fs.unlink(f); } catch { /* ignore */ }
    }

    res.json({
      success: true,
      svgContent,
      svgUrl: `http://localhost:${PORT}/svg/${filename}.svg`,
    });

  } catch (error) {
    console.error('LaTeX compilation error:', error);

    // Try to read the log file if it exists
    const logFile = path.join(tempDir, `${filename}.log`);
    let errorDetails = error.message;
    try {
      const logContent = await fs.readFile(logFile, 'utf-8');
      const match = logContent.match(/! .*/);
      if (match) errorDetails = match[0];
    } catch { /* ignore */ }

    // Cleanup any temp files
    try {
      const files = await fs.readdir(tempDir);
      for (const f of files) {
        if (f.startsWith(filename)) {
          await fs.unlink(path.join(tempDir, f));
        }
      }
    } catch { /* ignore */ }

    res.status(500).json({
      success: false,
      error: 'LaTeX compilation failed. Ensure pdflatex and pdf2svg are installed.',
      details: errorDetails,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ LaTeX rendering server running at http://localhost:${PORT}`);
  console.log('Requires: pdflatex and pdf2svg installed (brew install pdf2svg mactex).');
});
