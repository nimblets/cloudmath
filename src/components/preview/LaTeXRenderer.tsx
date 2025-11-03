import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
  backendUrl?: string;
}

interface BackendFragment {
  placeholder: string;
  code: string;
  svg?: string; // store latest SVG
}

export const LaTeXRenderer = ({ content, backendUrl = "http://localhost:3001/api/render-latex" }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backendFragments = useRef<BackendFragment[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const active = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;
    active.current = true;

    const renderBackendFragment = async (fragment: string): Promise<string> => {
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
          return `<div class="my-4 text-red-700 p-2 rounded">
                    <strong>Backend Error:</strong> ${data.details || data.error || "Unknown"}
                  </div>`;
        }
      } catch {
        return `<div class="my-4 text-red-700 p-2 rounded">
                  <strong>Backend Error:</strong> Server not running
                </div>`;
      }
    };

    const processContent = () => {
      if (!active.current) return;
      let html = content;

      // Strip documentclass, begin/end document
      const docMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      html = docMatch ? docMatch[1] : html;

      // Sections, subsections, title/author/date
      html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
      html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
      html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
      html = html.replace(/\\maketitle/g, "");
      html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
      html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
      html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

      // Extract backend-needed fragments
      const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
      backendFragments.current = [];
      html = html.replace(backendRegex, match => {
        const placeholder = `__BACKEND_${backendFragments.current.length}__`;
        backendFragments.current.push({ placeholder, code: match });
        return placeholder;
      });

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
        return '<div class="my-4 overflow-x-auto">' + lines.map(line =>
          katex.renderToString(line.replace(/&/g, ""), { displayMode: true, throwOnError: false })
        ).join('') + '</div>';
      });

      // Paragraphs
      html = html.split('\n\n').map(para => {
        const trimmed = para.trim();
        if (!trimmed || trimmed.includes('__BACKEND_')) return trimmed;
        if (trimmed.startsWith('<')) return trimmed;
        return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
      }).join('\n');

      // Insert placeholders safely (first time: green "Rendering...", else existing SVG)
      backendFragments.current.forEach(frag => {
        html = html.replaceAll(
          frag.placeholder,
          frag.svg || `<div data-backend="${frag.placeholder}" class="my-4 text-green-600 p-2 rounded">Rendering...</div>`
        );
      });

      if (containerRef.current) containerRef.current.innerHTML = html;

      // Debounce backend rendering
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        for (const frag of backendFragments.current) {
          const svg = await renderBackendFragment(frag.code);
          if (!active.current) return;
          frag.svg = svg;
          const el = containerRef.current!.querySelector(`div[data-backend="${frag.placeholder}"]`);
          if (el) el.outerHTML = `<div data-backend="${frag.placeholder}">${svg}</div>`;
        }
      }, 300);
    };

    processContent();

    return () => {
      active.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [content, backendUrl]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: 'serif' }} />;
};
