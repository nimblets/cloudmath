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

    const wrapCenteredBlock = (innerHtml: string) => {
      return `<div class="block-center my-4" style="text-align:center;">${innerHtml}</div>`;
    };

    const renderTikZWithLocalLatex = async (tikzCode: string): Promise<string> => {
      try {
        const response = await fetch('http://localhost:3001/api/render-tikz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tikzCode }),
        });
        const data = await response.json();
        if (data.success && data.svgContent) return `<div class="inline-block">${data.svgContent}</div>`;
        return `<div class="text-destructive">LaTeX Error: ${data.details || data.error}</div>`;
      } catch (error) {
        return `<div class="text-destructive">Backend Error: Server not running</div>`;
      }
    };

    // Extract only content inside document
    const docMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    let html = docMatch ? docMatch[1] : content;

    // Extract title, author, date
    const titleMatch = html.match(/\\title\{([^}]+)\}/);
    const authorMatch = html.match(/\\author\{([^}]*)\}/);
    const dateMatch = html.match(/\\date\{([^}]*)\}/);
    const title = titleMatch ? titleMatch[1] : '';
    const author = authorMatch ? authorMatch[1] : '';
    const date = dateMatch ? dateMatch[1] : '';

    // Remove \title, \author, \date, \maketitle from html
    html = html.replace(/\\title\{[^}]+\}/g, '')
               .replace(/\\author\{[^}]*\}/g, '')
               .replace(/\\date\{[^}]*\}/g, '')
               .replace(/\\maketitle/g, '');

    // Render title block
    let titleBlock = '';
    if (title) titleBlock += `<h1 class="text-3xl font-bold mb-2">${title}</h1>`;
    if (author) titleBlock += `<p class="text-sm text-muted-foreground mb-1">${author}</p>`;
    if (date) titleBlock += `<p class="text-xs text-muted-foreground mb-4">${date}</p>`;
    html = titleBlock + html;

    // Sections
    html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
               .replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
               .replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

    // TikZ pictures
    const tikzPictures: Array<{ placeholder: string; code: string }> = [];
    html = html.replace(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g, (match) => {
      const placeholder = `__TIKZ_${tikzPictures.length}__`;
      tikzPictures.push({ placeholder, code: match });
      return placeholder;
    });

    // Inline math
    html = html.replace(/\$([^$]+)\$/g, (_, equation) => {
      try {
        return katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false });
      } catch { return `<span class="text-destructive">${equation}</span>`; }
    });

    // Display math
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
      try {
        return `<div class="my-4 overflow-x-auto">${katex.renderToString(equation.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch { return `<div class="my-4 text-destructive">${equation}</div>`; }
    });

    // Align environments
    html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, equations) => {
      try {
        const eqns = equations.split('\\\\').filter((e: string) => e.trim());
        return wrapCenteredBlock(eqns.map(eq => katex.renderToString(eq.replace(/&=/g,'=').trim(), { displayMode: true, throwOnError: false })).join(''));
      } catch { return `<div class="my-4 text-destructive">Align error</div>`; }
    });

    // Tables
    html = html.replace(/\\begin\{tabular\}\{([^}]+)\}([\s\S]*?)\\end\{tabular\}/g, (_, cols, rows) => {
      const rowArray = rows.split('\\\\').filter(r => r.trim());
      const tableRows = rowArray.map(row => {
        const cells = row.split('&').map(cell => cell.replace(/\\hline/g,'').trim());
        return `<tr>${cells.map(cell => `<td class="border border-border px-3 py-2">${cell}</td>`).join('')}</tr>`;
      }).join('');
      return wrapCenteredBlock(`<table class="border-collapse border border-border mx-auto"><tbody>${tableRows}</tbody></table>`);
    });

    // Figures
    html = html.replace(/\\begin\{figure\}([\s\S]*?)\\end\{figure\}/g, (_, figureContent) => {
      let innerContent = figureContent.replace(/\\centering/g, '');
      innerContent = innerContent.replace(/\\includegraphics(?:\[([^\]]+)\])?\{([^}]+)\}/g, (_, options, path) => {
        const style = options ? `style="${options.replace(/,/g,';')}"` : '';
        return `<img src="${path}" ${style} />`;
      });
      const captionMatch = innerContent.match(/\\caption\{([^}]+)\}/);
      const captionHtml = captionMatch ? `<p class="text-sm text-center text-muted-foreground mt-2">${captionMatch[1]}</p>` : '';
      innerContent = innerContent.replace(/\\caption\{[^}]+\}/g, '');
      return wrapCenteredBlock(innerContent + captionHtml);
    });

    // Lists
    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
      const itemArray = items.split('\\item').filter(i => i.trim());
      const listItems = itemArray.map(i => `<li class="ml-4">${i.trim()}</li>`).join('');
      return `<ul class="list-disc my-4">${listItems}</ul>`;
    });

    html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      const itemArray = items.split('\\item').filter(i => i.trim());
      const listItems = itemArray.map(i => `<li class="ml-4">${i.trim()}</li>`).join('');
      return `<ol class="list-decimal my-4">${listItems}</ol>`;
    });

    // Comments
    html = html.replace(/^%.*$/gm, '<span class="text-muted-foreground text-sm italic">$&</span>');

    // Render TikZ asynchronously
    const renderAllTikZ = async () => {
      for (const { placeholder, code } of tikzPictures) {
        const rendered = await renderTikZWithLocalLatex(code);
        html = html.replace(placeholder, wrapCenteredBlock(rendered));
      }
      if (containerRef.current) containerRef.current.innerHTML = html;
    };

    if (tikzPictures.length > 0) {
      renderAllTikZ();
      return;
    }

    containerRef.current.innerHTML = html;
  }, [content]);

  return <div ref={containerRef} className="prose prose-slate dark:prose-invert max-w-none" style={{ fontFamily: 'serif' }} />;
};
