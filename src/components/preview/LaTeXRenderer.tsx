import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Send TikZ fragments to backend for rendering
    const renderTikZWithBackend = async (tikzCode: string): Promise<string> => {
      try {
        const response = await fetch("http://localhost:3001/api/render-tikz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tikzCode }),
        });

        const data = await response.json();
        if (data.success && data.svgContent) {
          return `<div class="my-4 flex justify-center">${data.svgContent}</div>`;
        } else {
          return `<div class="text-destructive text-sm p-2 border border-destructive rounded">
                    <strong>LaTeX Error:</strong> ${data.details || data.error || "Unknown error"}
                  </div>`;
        }
      } catch (error) {
        return `<div class="text-destructive text-sm p-2 border border-destructive rounded">
                  <strong>Backend Error:</strong> Server not running
                </div>`;
      }
    };

    // Extract only the content inside \begin{document} ... \end{document}
    const documentMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    const docContent = documentMatch ? documentMatch[1] : content;

    // Keep track of TikZ blocks
    const tikzBlocks: Array<{ placeholder: string; code: string }> = [];
    let html = docContent.replace(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g, (match) => {
      const placeholder = `__TIKZ_${tikzBlocks.length}__`;
      tikzBlocks.push({ placeholder, code: match });
      return placeholder;
    });

    // Render title, author, date
    const titleMatch = content.match(/\\title\{([^}]+)\}/);
    const authorMatch = content.match(/\\author\{([^}]+)\}/);
    const dateMatch = content.match(/\\date\{([^}]+)\}/);

    let preambleHtml = "";
    if (titleMatch) preambleHtml += `<h1 class="text-3xl font-bold mb-2">${titleMatch[1]}</h1>`;
    if (authorMatch) preambleHtml += `<p class="text-sm text-muted-foreground mb-1">${authorMatch[1]}</p>`;
    if (dateMatch) preambleHtml += `<p class="text-xs text-muted-foreground mb-4">${dateMatch[1]}</p>`;

    html = preambleHtml + html;

    // Handle sections
    html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
    html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-2 mb-1">$1</h4>');

    // Inline math $...$
    html = html.replace(/\$([^$]+)\$/g, (_, equation) => {
      try {
        return katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="text-destructive text-sm">${equation}</span>`;
      }
    });

    // Display math \[ ... \]
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
      try {
        return `<div class="my-4 overflow-x-auto">${katex.renderToString(equation.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch {
        return `<div class="text-destructive text-sm">${equation}</div>`;
      }
    });

    // Align environment
    html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, equations) => {
      try {
        const eqns = equations.split("\\\\").filter((e: string) => e.trim());
        return '<div class="my-4 overflow-x-auto">' + eqns.map((eq: string) => {
          return katex.renderToString(eq.replace(/&=/g, "=").trim(), { displayMode: true, throwOnError: false });
        }).join("") + '</div>';
      } catch {
        return `<div class="text-destructive text-sm">Align error</div>`;
      }
    });

    // Lists
    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
      const itemArray = items.split("\\item").filter(Boolean);
      return `<ul class="list-disc my-2">${itemArray.map(i => `<li>${i.trim()}</li>`).join("")}</ul>`;
    });
    html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      const itemArray = items.split("\\item").filter(Boolean);
      return `<ol class="list-decimal my-2">${itemArray.map(i => `<li>${i.trim()}</li>`).join("")}</ol>`;
    });

    // Paragraphs
    html = html.split("\n\n").map(para => {
      const trimmed = para.trim();
      if (!trimmed || trimmed.includes("__TIKZ_") || trimmed.startsWith("<")) return trimmed;
      return `<p class="mb-3 leading-relaxed">${trimmed}</p>`;
    }).join("\n");

    // Async TikZ rendering
    const renderTikzBlocks = async () => {
      for (const block of tikzBlocks) {
        const svg = await renderTikZWithBackend(block.code);
        html = html.replace(block.placeholder, svg);
      }
      if (containerRef.current) containerRef.current.innerHTML = html;
    };

    if (tikzBlocks.length > 0) {
      renderTikzBlocks();
    } else {
      containerRef.current.innerHTML = html;
    }

  }, [content]);

  return (
    <div
      ref={containerRef}
      className="prose prose-slate dark:prose-invert max-w-none"
      style={{ fontFamily: "serif" }}
    />
  );
};
