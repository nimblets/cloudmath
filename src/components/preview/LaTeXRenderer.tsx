import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
  backendUrl?: string;
}

export const LaTeXRenderer = ({ content, backendUrl = "http://localhost:3001/api/render-latex" }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const backendFragmentsRef = useRef<Record<string, string>>({}); // keeps current SVGs

  const renderBackendFragment = async (fragment: string) => {
    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragment }),
      });
      const data = await response.json();
      if (data.success && data.svgContent) {
        return `<div class="my-4 flex justify-center p-2 rounded">${data.svgContent}</div>`;
      } else {
        return `<div class="my-4 text-red-700 border border-red-500 p-2 rounded">
                  <strong>Backend Error:</strong> ${data.details || data.error || "Unknown"}
                </div>`;
      }
    } catch {
      return `<div class="my-4 text-red-700 border border-red-500 p-2 rounded">
                <strong>Backend Error:</strong> Server not running
              </div>`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let active = true;

    const processContent = async () => {
      if (!active) return;

      let html = content;

      // Extract document body
      const docMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      html = docMatch ? docMatch[1] : html;

      // Sections
      html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
      html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
      html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
      html = html.replace(/\\maketitle/g, "");
      html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
      html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
      html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

      // Inline math
      html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-red-500">${eq}</span>`;
        }
      });

      // Display math
      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
        try {
          return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="text-red-500 my-4">${eq}</div>`;
        }
      });

      // Align
      html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, eqs) => {
        const lines = eqs.split("\\\\").filter(l => l.trim());
        return '<div class="my-4 overflow-x-auto">' + lines.map(line => {
          return katex.renderToString(line.replace(/&/g, ""), { displayMode: true, throwOnError: false });
        }).join('') + '</div>';
      });

      // Detect backend fragments
      const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
      const fragments: { placeholder: string; code: string }[] = [];
      html = html.replace(backendRegex, match => {
        const placeholder = `__BACKEND_${fragments.length}__`;
        fragments.push({ placeholder, code: match });
        // Keep old SVG if it exists
        const currentSVG = backendFragmentsRef.current[placeholder];
        if (currentSVG) {
          return currentSVG;
        }
        return `<span data-backend="${placeholder}" class="text-green-600">Rendering...</span>`;
      });

      // Paragraphs
      html = html.split('\n\n').map(para => {
        const trimmed = para.trim();
        if (!trimmed || trimmed.includes('__BACKEND_')) return trimmed;
        if (trimmed.startsWith('<')) return trimmed;
        return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
      }).join('\n');

      if (containerRef.current) containerRef.current.innerHTML = html;

      // Debounce backend rendering (single timer)
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        for (const { placeholder, code } of fragments) {
          if (!active) return;
          const svg = await renderBackendFragment(code);
          if (!active) return;
          backendFragmentsRef.current[placeholder] = svg; // save SVG
          const el = containerRef.current!.querySelector(`span[data-backend="${placeholder}"]`);
          if (el) el.outerHTML = svg;
        }
      }, 300);
    };

    processContent();

    return () => {
      active = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [content, backendUrl]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: 'serif' }} />;
};
