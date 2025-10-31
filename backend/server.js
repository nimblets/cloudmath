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

// Serve static SVG files
app.use('/svg', express.static(path.join(__dirname, 'temp')));

app.post('/api/render-tikz', async (req, res) => {
  const tempDir = path.join(__dirname, 'temp');
  const filename = `tikz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const texFile = path.join(tempDir, `${filename}.tex`);
  const dviFile = path.join(tempDir, `${filename}.dvi`);
  const pdfFile = path.join(tempDir, `${filename}.pdf`);
  const svgFile = path.join(tempDir, `${filename}.svg`);

  try {
    const { tikzCode } = req.body;

    // Create temp directory if it doesn't exist
    await fs.mkdir(tempDir, { recursive: true });

    // Create LaTeX document
    const fullLatex = `\\documentclass[border=2pt]{standalone}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikzCode}
\\end{document}`;

    // Write LaTeX file
    await fs.writeFile(texFile, fullLatex);

    // Compile LaTeX to DVI
    await execAsync(`latex -interaction=nonstopmode -output-directory=${tempDir} ${texFile}`, {
      cwd: tempDir,
      timeout: 10000
    });

    // Convert DVI to PDF
    await execAsync(`dvipdf ${dviFile} ${pdfFile}`, {
      cwd: tempDir,
      timeout: 5000
    });

    // Convert PDF to SVG using pdf2svg
    await execAsync(`pdf2svg ${pdfFile} ${svgFile}`, {
      cwd: tempDir,
      timeout: 5000
    });

    // Read SVG content
    const svgContent = await fs.readFile(svgFile, 'utf-8');

    // Cleanup temporary files
    const filesToClean = [texFile, dviFile, pdfFile, 
      path.join(tempDir, `${filename}.aux`),
      path.join(tempDir, `${filename}.log`)];
    
    for (const file of filesToClean) {
      try {
        await fs.unlink(file);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Return SVG content directly
    res.json({ 
      success: true, 
      svgContent,
      svgUrl: `http://localhost:${PORT}/svg/${filename}.svg`
    });

  } catch (error) {
    console.error('LaTeX compilation error:', error);
    
    // Try to read log file for detailed error
    const logFile = path.join(tempDir, `${filename}.log`);
    let errorDetails = error.message;
    try {
      const logContent = await fs.readFile(logFile, 'utf-8');
      const errorMatch = logContent.match(/! .*/);
      if (errorMatch) {
        errorDetails = errorMatch[0];
      }
    } catch (e) {
      // Log file not available
    }

    // Cleanup on error
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.startsWith(filename)) {
          await fs.unlink(path.join(tempDir, file));
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    res.status(500).json({ 
      success: false, 
      error: 'LaTeX compilation failed. Make sure TeX Live is installed.',
      details: errorDetails
    });
  }
});

app.listen(PORT, () => {
  console.log(`LaTeX rendering server running on http://localhost:${PORT}`);
  console.log('Requirements: latex, dvipdf, pdf2svg must be installed');
});
