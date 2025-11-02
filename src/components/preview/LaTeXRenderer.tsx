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

    // Send a fragment to the backend to compile full LaTeX
    const renderFragmentBackend = async (fragment: string): Promise<string> => {
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

    // Extract document content if wrapped in \begin{document}...\end{document}
    const documentMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    const documentContent = documentMatch ? documentMatch[1] : content;

    let html = documentContent;

    // Replace title, author, date for KaTeX rendering
    html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
    html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
    html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
    html = html.replace(/\\maketitle/g, ""); // already rendered

    // Replace sections
    html = html.replace(/\\section\*?\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    html = html.replace(/\\subsection\*?\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/\\subsubsection\*?\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

    // Handle inline math $...$
    html = html.replace(/\$([^$]+)\$/g, (_, equation) => {
      try {
        return katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `<span class="text-destructive text-sm">${equation}</span>`;
      }
    });

    // Handle display math \[...\]
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
      try {
        return `<div class="my-4 overflow-x-auto">${katex.renderToString(equation.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch {
        return `<div class="text-destructive text-sm">${equation}</div>`;
      }
    });

    // Detect fragments that KaTeX cannot handle (everything with \begin{...} except align)
    const backendFragments: Array<{ placeholder: string; code: string }> = [];
    html = html.replace(/\\begin\{(?!align\*?\})[\s\S]*?\\end\{[\s\S]*?\}/g, (match) => {
      const placeholder = `__LATEX_FRAGMENT_${backendFragments.length}__`;
      backendFragments.push({ placeholder, code: match });
      return placeholder;
    });

    // Render backend fragments asynchronously
    const renderAllBackend = async () => {
      for (const { placeholder, code } of backendFragments) {
        const rendered = await renderFragmentBackend(code);
        html = html.replace(placeholder, rendered);
      }
      if (containerRef.current) containerRef.current.innerHTML = html;
    };

    if (backendFragments.length > 0) {
      renderAllBackend();
      return; // exit early
    }

    // Split remaining content into paragraphs
    html = html
      .split("\n\n")
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed || trimmed.startsWith("<") || trimmed.includes("__LATEX_FRAGMENT_")) return trimmed;
        return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
      })
      .join("\n");

    containerRef.current.innerHTML = html;
  }, [content]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: "serif" }} />;
};
