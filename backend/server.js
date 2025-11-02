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

    // Minimal standalone LaTeX file for safe compilation
    const fullLatex = `
\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\usepackage{amsmath}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikzCode}
\\end{document}
`;
    await fs.writeFile(texFile, fullLatex);

    // Compile with no shell escape for security
    await execAsync(`pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error -output-directory=${tempDir} ${texFile}`, {
      cwd: tempDir,
      timeout: 15000,
    });

    // Convert PDF to SVG
    await execAsync(`pdf2svg ${pdfFile} ${svgFile}`, {
      cwd: tempDir,
      timeout: 5000,
    });

    // Read and return SVG content
    const svgContent = await fs.readFile(svgFile, 'utf-8');

    // Cleanup temporary files (keep only svg if needed)
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
    });

  } catch (error) {
    console.error('LaTeX compilation error:', error);

    // Try reading log file for more details
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
      error: 'LaTeX compilation failed.',
      details: errorDetails,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ LaTeX rendering server running at http://localhost:${PORT}`);
  console.log('Safe defaults: no shell escape, per-request temp files.');
  console.log('Requires: pdflatex and pdf2svg installed.');
});
