import { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

interface BackendFragment {
  placeholder: string;
  code: string;
  svg?: string;
  timer?: NodeJS.Timeout;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [backendFragments, setBackendFragments] = useState<BackendFragment[]>([]);

  // Send fragment to backend
  const renderBackendFragment = async (fragment: string): Promise<string> => {
    try {
      const response = await fetch("http://localhost:3001/api/render-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragment }),
      });
      const data = await response.json();
      if (data.success && data.svgContent) {
        return `<div class="my-4 flex justify-center">${data.svgContent}</div>`;
      } else {
        return `<div class="text-destructive p-2 border border-destructive rounded my-2">
                  <strong>Backend Error:</strong> ${data.details || data.error || "Unknown"}
                </div>`;
      }
    } catch (e) {
      return `<div class="text-destructive p-2 border border-destructive rounded my-2">
                <strong>Backend Error:</strong> Server not running
              </div>`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    let html = content;

    // Extract document body
    const docMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    html = docMatch ? docMatch[1] : html;

    // Sections, title, author, date
    html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
    html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
    html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
    html = html.replace(/\\maketitle/g, "");
    html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

    // Inline math: $...$
    html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
      try {
        return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="text-destructive">${eq}</span>`;
      }
    });

    // Display math: \[...\]
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
      try {
        return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch {
        return `<div class="text-destructive my-4">${eq}</div>`;
      }
    });

    // Align environment
    html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, eqs) => {
      const lines = eqs.split("\\\\").filter(l => l.trim());
      return '<div class="my-4 overflow-x-auto">' + lines.map(line => {
        const cleaned = line.replace(/&/g, '');
        return katex.renderToString(cleaned, { displayMode: true, throwOnError: false });
      }).join('') + '</div>';
    });

    // Detect backend-needed fragments
    const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
    const fragments: BackendFragment[] = [];
    html = html.replace(backendRegex, (match) => {
      const placeholder = `__BACKEND_${fragments.length}__`;
      fragments.push({ placeholder, code: match, svg: undefined });
      return `<div id="${placeholder}" class="border-2 border-green-500 p-2 my-4 flex justify-center">Rendering...</div>`;
    });

    // Paragraphs
    html = html.split('\n\n').map(para => {
      const trimmed = para.trim();
      if (!trimmed || trimmed.includes('__BACKEND_')) return trimmed;
      if (trimmed.startsWith('<')) return trimmed;
      return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
    }).join('\n');

    if (containerRef.current) containerRef.current.innerHTML = html;

    // Render backend fragments asynchronously with debounce
    fragments.forEach((frag) => {
      if
