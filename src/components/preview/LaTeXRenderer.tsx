import { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
}

export const LaTeXRenderer = ({ content }: LaTeXRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const backendTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const renderBackendFragment = async (fragment: string, placeholderId: string, isFirstRender: boolean) => {
    const placeholderEl = document.getElementById(placeholderId);
    if (isFirstRender && placeholderEl) {
      placeholderEl.style.border = "2px solid #22c55e"; // green border
      placeholderEl.style.padding = "0.25rem";
    }

    try {
      const response = await fetch("http://localhost:3001/api/render-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fragment }),
      });
      const data = await response.json();

      if (placeholderEl && isFirstRender) {
        placeholderEl.style.border = "";
        placeholderEl.style.padding = "";
      }

      if (data.success && data.svgContent) {
        if (placeholderEl) {
          // Replace placeholder content smoothly
          placeholderEl.innerHTML = data.svgContent;
        }
      } else {
        if (placeholderEl) {
          placeholderEl.innerHTML = `<div class="text-destructive p-2 border border-destructive rounded my-2">
            <strong>Backend Error:</strong> ${data.details || data.error || "Unknown"}
          </div>`;
        }
      }
    } catch {
      if (placeholderEl && isFirstRender) {
        placeholderEl.style.border = "";
        placeholderEl.style.padding = "";
      }
      if (placeholderEl) {
        placeholderEl.innerHTML = `<div class="text-destructive p-2 border border-destructive rounded my-2">
          <strong>Backend Error:</strong> Server not running
        </div>`;
      }
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const processContent = () => {
      let html = content;

      // Strip document class and document begin/end
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

      // Detect backend-needed fragments: tcolorbox, tikzpicture, table, figure
      const backendRegex = /\\begin\{(tcolorbox|tikzpicture|table|figure)[\s\S]*?\\end\{\1\}/g;
      const fragments: { placeholder: string; code: string }[] = [];
      html = html.replace(backendRegex, (match, p1) => {
        const placeholderId = `backend-${fragments.length}-${Date.now()}`;
        fragments.push({ placeholder: placeholderId, code: match });
        return `<div id="${placeholderId}">${match}</div>`; // keep original until backend swaps
      });

      // Inline math: $...$
      html = html.replace(/\$([^$]+)\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-red-600">${eq}</span>`;
        }
      });

      // Display math: \[...\]
      html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => {
        try {
          return `<div class="my-4 overflow-x-auto">${katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="text-red-600 my-4">${eq}</div>`;
        }
      });

      if (containerRef.current) containerRef.current.innerHTML = html;

      // Process backend fragments with debounce and onBlur
      fragments.forEach(({ placeholder, code }) => {
        const el = document.getElementById(placeholder);
        if (!el) return;

        const triggerBackend = () => renderBackendFragment(code, placeholder, true);

        // Debounce: wait 300ms after last change
        if (backendTimers.current[placeholder]) clearTimeout(backendTimers.current[placeholder]);
        backendTimers.current[placeholder] = setTimeout(triggerBackend, 300);

        // Also trigger on blur in case user stopped typing
        el.addEventListener("blur", () => triggerBackend());
      });
    };

    processContent();
  }, [content]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: "serif" }} />;
};
