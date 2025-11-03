import { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backendTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [backendCache, setBackendCache] = useState<{ [key: string]: string }>({});

  const renderBackendFragment = async (fragment: string, placeholder: string) => {
    try {
      const response = await fetch("http://localhost:3001/api/render-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragment }),
      });

      const data = await response.json();

      let svgHtml = "";
      if (data.success && data.svgContent) {
        svgHtml = `<div class="my-4 border-2 border-green-500 p-2 flex justify-center">${data.svgContent}</div>`;
      } else {
        svgHtml = `<div class="my-4 border-2 border-red-500 p-2">
          <strong>Backend Error:</strong> ${data.details || data.error || "Unknown"}
        </div>`;
      }

      setBackendCache(prev => ({ ...prev, [placeholder]: svgHtml }));
    } catch (e) {
      const errorHtml = `<div class="my-4 border-2 border-red-500 p-2">
        <strong>Backend Error:</strong> Server not running
      </div>`;
      setBackendCache(prev => ({ ...prev, [placeholder]: errorHtml }));
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const processContent = () => {
      let html = content;

      // Sections, subsections, title/author/date
      html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
      html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
      html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
      html = html.replace(/\\maketitle/g, "");

      html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
      html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
      html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

      // Detect backend-needed fragments
      const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
      const fragments: { placeholder: string; code: string }[] = [];
      html = html.replace(backendRegex, match => {
        const placeholder = `__BACKEND_${fragments.length}__`;
        fragments.push({ placeholder, code: match });
        // Insert cached SVG if available, otherwise placeholder box
        return backendCache[placeholder] || `<div id="${placeholder}" class="my-4 border-2 border-green-500 p-2">Rendering...</div>`;
      });

      // Inline math: $...$
      html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-red-500">${eq}</span>`;
        }
      });

      // Display math: \[...\]
      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
        try {
          return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="text-red-500 my-4">${eq}</div>`;
        }
      });

      // Paragraphs
      html = html.split("\n\n").map(para => {
        const trimmed = para.trim();
        if (!trimmed) return "";
        if (trimmed.includes("__BACKEND_")) return trimmed;
        if (trimmed.startsWith("<")) return trimmed;
        return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
      }).join("\n");

      if (containerRef.current) containerRef.current.innerHTML = html;

      // Debounced backend renders
      fragments.forEach(({ placeholder, code }) => {
        if (backendTimers.current[placeholder]) clearTimeout(backendTimers.current[placeholder]);
        backendTimers.current[placeholder] = setTimeout(() => renderBackendFragment(code, placeholder), 200);
      });
    };

    processContent();
  }, [content, backendCache]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: 'serif' }} />;
};
