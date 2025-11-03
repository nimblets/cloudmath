import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBackendFragmentsRef = useRef<Record<string, string>>({}); // placeholder -> svg

  // Helper: send fragment to backend
  const renderBackendFragment = async (fragment: string): Promise<string> => {
    try {
      const response = await fetch("http://localhost:3001/api/render-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragment }),
      });

      const data = await response.json();
      if (data.success && data.svgContent) {
        return `<div class="my-4 flex justify-center border border-green-500 rounded">${data.svgContent}</div>`;
      } else {
        return `<div class="my-4 p-2 border border-red-500 rounded text-red-600">
                  <strong>Backend Error:</strong> ${data.details || data.error || "Unknown"}
                </div>`;
      }
    } catch (e) {
      return `<div class="my-4 p-2 border border-red-500 rounded text-red-600">
                <strong>Backend Error:</strong> Server not running
              </div>`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const processContent = async () => {
      let html = content;

      // Extract document content if present
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

      // Paragraphs split by double newlines
      html = html.split("\n\n").map(para => para.trim()).join("\n");

      // Detect backend-needed fragments
      const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
      const fragments: { placeholder: string, code: string }[] = [];
      html = html.replace(backendRegex, match => {
        const placeholder = `__BACKEND_${fragments.length}__`;
        fragments.push({ placeholder, code: match });
        return placeholder;
      });

      // Detect fragments containing display math \[...\] or inline math $...$ inside backend
      fragments.forEach(f => {
        if (/\\\[([\s\S]*?)\\\]|\$[^$]+\$/g.test(f.code)) {
          // already included in backend
        }
      });

      // Render KaTeX for non-backend inline/display math
      html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false, output: "html" });
        } catch {
          return `<span class="text-red-600">${eq}</span>`;
        }
      });

      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
        try {
          return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="text-red-600 my-4">${eq}</div>`;
        }
      });

      // Paragraphs wrapping for non-backend text
      html = html.split("\n").map(line => {
        if (line.includes("__BACKEND_")) return line;
        if (!line.trim()) return "";
        if (line.startsWith("<")) return line;
        return `<p class="mb-4 leading-relaxed">${line}</p>`;
      }).join("\n");

      // Handle backend fragments with debounce and preserve current image
      if (fragments.length > 0) {
        if (backendTimeoutRef.current) clearTimeout(backendTimeoutRef.current);
        backendTimeoutRef.current = setTimeout(async () => {
          for (const { placeholder, code } of fragments) {
            const prev = lastBackendFragmentsRef.current[placeholder] || "";
            const svg = await renderBackendFragment(code);
            html = html.replace(placeholder, svg);
            lastBackendFragmentsRef.current[placeholder] = svg;
          }
          if (containerRef.current) containerRef.current.innerHTML = html;
        }, 200); // 200ms debounce
      } else {
        // No backend fragments, render immediately
        if (containerRef.current) containerRef.current.innerHTML = html;
      }
    };

    processContent();
  }, [content]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: "serif" }} />;
};
