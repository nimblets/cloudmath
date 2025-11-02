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

app.post('/api/render-latex', async (req, res) => {
  const tempDir = path.join(__dirname, 'temp');
  const filename = `latex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const texFile = path.join(tempDir, `${filename}.tex`);
  const pdfFile = path.join(tempDir, `${filename}.pdf`);
  const svgFile = path.join(tempDir, `${filename}.svg`);

  try {
    let { fragment } = req.body;
    if (!fragment || typeof fragment !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid fragment.' });
    }

    await fs.mkdir(tempDir, { recursive: true });

    // Minimal standalone LaTeX file with common packages
    const fullLatex = `
\\documentclass[border=2pt]{standalone}

% Math & symbols
\\usepackage{amsmath, amssymb, amsfonts}

% Colors & boxes
\\usepackage{xcolor}
\\usepackage{tcolorbox}

% Graphics
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usepackage{graphicx}

% Optional nice font
\\usepackage{lmodern}

% Centering for figures, tables, tikz
\\usepackage{float}
\\usepackage{caption}

\\begin{document}
${fragment}
\\end{document}
`;

    await fs.writeFile(texFile, fullLatex);

    // Compile safely (no shell escape)
    await execAsync(`pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error -output-directory=${tempDir} ${texFile}`, {
      cwd: tempDir,
      timeout: 15000,
    });

    // Convert PDF → SVG
    await execAsync(`pdf2svg ${pdfFile} ${svgFile}`, { cwd: tempDir, timeout: 5000 });

    const svgContent = await fs.readFile(svgFile, 'utf-8');

    // Cleanup temporary files
    const cleanupFiles = [
      texFile,
      pdfFile,
      path.join(tempDir, `${filename}.aux`),
      path.join(tempDir, `${filename}.log`),
    ];
    for (const f of cleanupFiles) {
      try { await fs.unlink(f); } catch {}
    }

    res.json({ success: true, svgContent });

  } catch (error) {
    console.error('LaTeX compilation error:', error);

    let errorDetails = error.message;
    try {
      const logFile = path.join(tempDir, `${filename}.log`);
      const logContent = await fs.readFile(logFile, 'utf-8');
      const match = logContent.match(/! .*/);
      if (match) errorDetails = match[0];
    } catch {}

    // Cleanup
    try {
      const files = await fs.readdir(tempDir);
      for (const f of files) {
        if (f.startsWith(filename)) await fs.unlink(path.join(tempDir, f));
      }
    } catch {}

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
  console.log('Supports: tikz, pgfplots, tcolorbox, tables, figures, math environments.');
  console.log('Requires: pdflatex and pdf2svg installed.');
});
