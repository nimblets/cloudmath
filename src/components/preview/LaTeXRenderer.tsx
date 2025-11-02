import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Backend detection for fragments
  const requiresBackend = (snippet: string) => {
    return /\\begin\{tikzpicture\}|\\fbox|\\colorbox|\\boxed/.test(snippet);
  };

  // Send snippet to backend for SVG rendering
  const renderBackend = async (snippet: string): Promise<string> => {
    try {
      const response = await fetch("http://localhost:3001/api/render-tikz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tikzCode: snippet }),
      });
      const data = await response.json();
      if (data.success && data.svgContent) return `<div class="my-4">${data.svgContent}</div>`;
      return `<div class="text-destructive p-2 border border-destructive rounded">
        <strong>LaTeX Error:</strong> ${data.details || data.error || "Unknown error"}
      </div>`;
    } catch (e) {
      return `<div class="text-destructive p-2 border border-destructive rounded">
        <strong>Backend Error:</strong> Server not running
      </div>`;
    }
  };

  // Frontend KaTeX rendering for math
  const renderFrontendMath = (text: string) => {
    // Display math
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
      try {
        return `<div class="my-4 overflow-x-auto">${katex.renderToString(
          equation.trim(),
          { displayMode: true, throwOnError: false }
        )}</div>`;
      } catch {
        return `<div class="my-4 text-destructive text-sm">Math error: ${equation}</div>`;
      }
    });

    // Align environments
    text = text.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, equations) => {
      const eqns = equations.split("\\\\").filter(e => e.trim());
      return '<div class="my-4 overflow-x-auto">' + eqns.map(eq => {
        const cleaned = eq.replace(/&=/g, "=").trim();
        try {
          return katex.renderToString(cleaned, { displayMode: true, throwOnError: false });
        } catch {
          return `<div class="text-destructive text-sm">${cleaned}</div>`;
        }
      }).join("") + "</div>";
    });

    // Inline math
    text = text.replace(/\$([^$]+)\$/g, (_, equation) => {
      try {
        return katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="text-destructive text-sm">${equation}</span>`;
      }
    });

    return text;
  };

  // Frontend rendering for sections, lists, tables, etc.
  const renderFrontendText = (text: string) => {
    let html = text;

    html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
    html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
    html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
    html = html.replace(/\\maketitle/g, "");

    html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
      const itemArray = items.split("\\item").filter(i => i.trim());
      return `<ul class="list-disc my-4">${itemArray.map(i => `<li class="ml-4">${i.trim()}</li>`).join("")}</ul>`;
    });

    html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      const itemArray = items.split("\\item").filter(i => i.trim());
      return `<ol class="list-decimal my-4">${itemArray.map(i => `<li class="ml-4">${i.trim()}</li>`).join("")}</ol>`;
    });

    // Tables
    html = html.replace(/\\begin\{tabular\}\{([^}]+)\}([\s\S]*?)\\end\{tabular\}/g, (_, cols, rows) => {
      const rowArray = rows.split("\\\\").filter(r => r.trim());
      const tableRows = rowArray.map(row => `<tr>${row.split("&").map(cell => `<td class="border border-border px-3 py-2">${cell.replace(/\\hline/g,'').trim()}</td>`).join("")}</tr>`).join("");
      return `<table class="border-collapse border border-border my-4"><tbody>${tableRows}</tbody></table>`;
    });

    // Comments
    html = html.replace(/^%.*$/gm, '<span class="text-muted-foreground text-sm italic">$&</span>');

    return html;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const processContent = async () => {
      // Split content into lines/fragments
      const fragments = content.split(/\n{2,}/).filter(f => f.trim());

      let html = "";

      for (const fragment of fragments) {
        if (requiresBackend(fragment)) {
          // Send backend fragments (TikZ, boxes, color)
          html += await renderBackend(fragment);
        } else {
          // Frontend only
          let text = renderFrontendMath(fragment);
          text = renderFrontendText(text);
          html += `<p class="mb-4 leading-relaxed">${text}</p>`;
        }
      }

      if (containerRef.current) containerRef.current.innerHTML = html;
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
