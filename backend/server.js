import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/render-tikz', async (req, res) => {
  try {
    const { tikzCode } = req.body;

    const fullLatex = `\\documentclass{article}
\\usepackage{tikz}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\begin{document}
${tikzCode}
\\end{document}`;

    const formData = new URLSearchParams();
    formData.append('formula', fullLatex);
    formData.append('fsize', '20px');
    formData.append('fcolor', '000000');
    formData.append('mode', '0');
    formData.append('out', '1');
    formData.append('remhost', 'quicklatex.com');

    const response = await fetch('https://quicklatex.com/latex3.f', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const text = await response.text();
    const lines = text.split('\n');

    if (lines[0] === '0' && lines[1]) {
      res.json({ success: true, imageUrl: lines[1] });
    } else {
      console.error('QuickLatex error:', text);
      res.status(400).json({ success: false, error: text });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`LaTeX rendering server running on http://localhost:${PORT}`);
});
