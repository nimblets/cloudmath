import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderBackendFragment = async (fragment: string): Promise<string> => {
      try {
        const response = await fetch("http://localhost:3001/api/render-latex", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fragment }),
        });

        const data = await response.json();
        if (data.success && data.svgContent) {
          return `<div class="my-4 flex justify-center text-green-600">${data.svgContent}</div>`;
        } else {
          return `<div class="text-red-600 p-2 border border-red-600 rounded my-2">
                    <strong>Error:</strong> ${data.details || data.error || "Unknown error"}
                  </div>`;
        }
      } catch {
        return `<div class="text-red-600 p-2 border border-red-600 rounded my-2">
                  <strong>Error:</strong> Backend not running
                </div>`;
      }
    };

    const processContent = async () => {
      let html = content;

      // extract document section
      const docMatch = html.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      html = docMatch ? docMatch[1] : html;

      // structure elements
      html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
      html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
      html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
      html = html.replace(/\\maketitle/g, "");

      html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
      html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
      html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

      // inline math
      html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-red-600">${eq}</span>`;
        }
      });

      // display math
      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
        try {
          return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="text-red-600 my-4">${eq}</div>`;
        }
      });

      // align blocks
      html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, eqs) => {
        const lines = eqs.split("\\\\").filter((l) => l.trim());
        return (
          '<div class="my-4 overflow-x-auto">' +
          lines
            .map((line) => {
              const cleaned = line.replace(/&/g, "");
              return katex.renderToString(cleaned, { displayMode: true, throwOnError: false });
            })
            .join("") +
          "</div>"
        );
      });

      // backend fragments
      const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
      const fragments: { placeholder: string; code: string }[] = [];
      html = html.replace(backendRegex, (match) => {
        const placeholder = `__BACKEND_${fragments.length}__`;
        fragments.push({ placeholder, code: match });
        // Show loading placeholder in green
        return `<div class="text-green-600 italic my-4">Rendering...</div>${placeholder}`;
      });

      // paragraphs
      html = html
        .split("\n\n")
        .map((para) => {
          const trimmed = para.trim();
          if (!trimmed || trimmed.includes("__BACKEND_")) return trimmed;
          if (trimmed.startsWith("<")) return trimmed;
          return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
        })
        .join("\n");

      // immediately show KaTeX-only content
      if (containerRef.current) containerRef.current.innerHTML = html;

      // handle backend fragments (debounced)
      if (fragments.length > 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(async () => {
          for (const { placeholder, code } of fragments) {
            const svg = await renderBackendFragment(code);
            html = html.replace(placeholder, svg);
          }
          if (containerRef.current) containerRef.current.innerHTML = html;
        }, 400);
      }
    };

    processContent();
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="prose prose-slate dark:prose-invert max-w-none"
      style={{ fontFamily: "serif" }}
    />
  );
};
