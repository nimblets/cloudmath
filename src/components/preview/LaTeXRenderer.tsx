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

    const renderTikZWithBackend = async (tikzCode: string): Promise<string> => {
      try {
        const response = await fetch("http://localhost:3001/api/render-tikz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tikzCode }),
        });
        const data = await response.json();
        if (data.success && data.svgContent) {
          return `<div class="inline-block">${data.svgContent}</div>`;
        } else {
          return `<div class="text-destructive text-sm p-2 border border-destructive rounded">
                    <strong>LaTeX Error:</strong> ${data.details || data.error || "Unknown error"}
                  </div>`;
        }
      } catch (e) {
        return `<div class="text-destructive text-sm p-2 border border-destructive rounded">
                  <strong>Backend Error:</strong> Server not running
                </div>`;
      }
    };

    const documentMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    const documentContent = documentMatch ? documentMatch[1] : content;

    let html = documentContent;

    // ===== Basic Text Rendering =====
    html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
    html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
    html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
    html = html.replace(/\\maketitle/g, "");
    html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

    // ===== Lists =====
    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
      const listItems = items.split("\\item").filter((i) => i.trim()).map(i => `<li class="ml-4">${i.trim()}</li>`).join("");
      return `<ul class="list-disc my-4">${listItems}</ul>`;
    });
    html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      const listItems = items.split("\\item").filter((i) => i.trim()).map(i => `<li class="ml-4">${i.trim()}</li>`).join("");
      return `<ol class="list-decimal my-4">${listItems}</ol>`;
    });

    // ===== Tables =====
    html = html.replace(/\\begin\{tabular\}\{([^}]+)\}([\s\S]*?)\\end\{tabular\}/g, (_, cols, rows) => {
      const tableRows = rows.split("\\\\").filter(r => r.trim()).map(row => {
        const cells = row.split("&").map(cell => `<td class="border border-border px-3 py-2">${cell.replace(/\\hline/g,"").trim()}</td>`);
        return `<tr>${cells.join("")}</tr>`;
      }).join("");
      return `<table class="border-collapse border border-border my-4"><tbody>${tableRows}</tbody></table>`;
    });

    html = html.replace(/\\caption\{([^}]+)\}/g, '<p class="text-sm text-center text-muted-foreground mt-2">$1</p>');

    // ===== Inline & Display Math =====
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
      try { return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`; }
      catch { return `<div class="text-destructive text-sm">Math error: ${eq}</div>`; }
    });
    html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
      try { return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false }); }
      catch { return `<span class="text-destructive text-sm">${eq}</span>`; }
    });
    html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, eqs) => {
      try {
        const eqArr = eqs.split("\\\\").filter(e => e.trim());
        return '<div class="my-4 overflow-x-auto">' + eqArr.map(e => katex.renderToString(e.replace(/&=/g,"=").trim(), { displayMode:true, throwOnError:false })).join('') + '</div>';
      } catch { return `<div class="text-destructive text-sm">Align error</div>`; }
    });

    // ===== TikZ/pgfplots =====
    const tikzFragments: { placeholder:string, code:string }[] = [];
    html = html.replace(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g, (match) => {
      const placeholder = `__TIKZ_${tikzFragments.length}__`;
      tikzFragments.push({ placeholder, code: match });
      return placeholder;
    });

    // ===== Paragraphs =====
    html = html.split("\n\n").map(p => {
      const t = p.trim();
      if (!t || t.startsWith("<") || t.includes("__TIKZ_")) return t;
      return `<p class="mb-4 leading-relaxed">${t}</p>`;
    }).join("\n");

    const renderAllTikZ = async () => {
      for (const { placeholder, code } of tikzFragments) {
        const svg = await renderTikZWithBackend(code);
        html = html.replace(placeholder, `<div class="my-4 flex justify-center">${svg}</div>`);
      }
      if (containerRef.current) containerRef.current.innerHTML = html;
    };

    if (tikzFragments.length > 0) {
      renderAllTikZ();
    } else {
      containerRef.current.innerHTML = html;
    }

  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className="prose prose-slate dark:prose-invert max-w-none preview-content"
      style={{ fontFamily: "serif" }}
    />
  );
};
