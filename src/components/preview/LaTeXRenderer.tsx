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

    const renderTikZWithLocalLatex = async (tikzCode: string): Promise<string> => {
      try {
        const response = await fetch('http://localhost:3001/api/render-tikz', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tikzCode }),
        });

        const data = await response.json();
        
        if (data.success && data.svgContent) {
          // Return the SVG content directly embedded
          return `<div class="inline-block">${data.svgContent}</div>`;
        } else {
          console.error('Rendering error:', data.error, data.details);
          return `<div class="text-destructive text-sm p-2 border border-destructive rounded">
            <strong>LaTeX Error:</strong><br/>
            ${data.details || data.error || 'Unknown error'}<br/>
            <small class="text-xs">Make sure TeX Live, dvipdf, and pdf2svg are installed</small>
          </div>`;
        }
      } catch (error) {
        console.error('Error rendering TikZ:', error);
        return `<div class="text-destructive text-sm p-2 border border-destructive rounded">
          <strong>Backend Error:</strong> Server not running<br/>
          <small class="text-xs">Start with: cd backend && npm install && npm start</small>
        </div>`;
      }
    };

    // Extract content between \begin{document} and \end{document}
    const documentMatch = content.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    const documentContent = documentMatch ? documentMatch[1] : content;

    // Parse sections
    let html = documentContent;

    // Replace \title
    html = html.replace(/\\title\{([^}]+)\}/g, '<h1 class="text-3xl font-bold mb-4">$1</h1>');
    
    // Replace \author
    html = html.replace(/\\author\{([^}]*)\}/g, '<p class="text-sm text-muted-foreground mb-2">$1</p>');
    
    // Replace \date
    html = html.replace(/\\date\{([^}]*)\}/g, '<p class="text-xs text-muted-foreground mb-6">$1</p>');
    
    // Replace \maketitle (just a marker, actual rendering done by above)
    html = html.replace(/\\maketitle/g, '');

    // Replace sections
    html = html.replace(/\\section\{([^}]+)\}/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
    html = html.replace(/\\subsection\{([^}]+)\}/g, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>');
    html = html.replace(/\\subsubsection\{([^}]+)\}/g, '<h4 class="text-lg font-medium mt-4 mb-2">$1</h4>');

    // Handle TikZ pictures - convert to images via QuickLatex
    const tikzPictures: Array<{ placeholder: string; code: string }> = [];
    html = html.replace(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g, (match) => {
      const placeholder = `__TIKZ_${tikzPictures.length}__`;
      tikzPictures.push({ placeholder, code: match });
      return placeholder;
    });

    // Handle display math: \[ ... \]
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, equation) => {
      try {
        return `<div class="my-4 overflow-x-auto">${katex.renderToString(equation.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch (e) {
        return `<div class="my-4 text-destructive text-sm">Math error: ${equation}</div>`;
      }
    });

    // Handle align environments
    html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, equations) => {
      try {
        const eqns = equations.split('\\\\').filter((e: string) => e.trim());
        return '<div class="my-4 overflow-x-auto">' + eqns.map((eq: string) => {
          const cleaned = eq.replace(/&=/g, '=').trim();
          return katex.renderToString(cleaned, {
            displayMode: true,
            throwOnError: false,
          });
        }).join('') + '</div>';
      } catch (e) {
        return `<div class="my-4 text-destructive text-sm">Align error</div>`;
      }
    });

    // Handle inline math: $...$
    html = html.replace(/\$([^$]+)\$/g, (_, equation) => {
      try {
        return katex.renderToString(equation.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch (e) {
        return `<span class="text-destructive text-sm">${equation}</span>`;
      }
    });

    // Handle tables
    html = html.replace(/\\begin\{table\}([\s\S]*?)\\end\{table\}/g, (_, tableContent) => {
      return `<div class="my-4 overflow-x-auto">${tableContent}</div>`;
    });
    
    html = html.replace(/\\begin\{tabular\}\{([^}]+)\}([\s\S]*?)\\end\{tabular\}/g, (_, cols, rows) => {
      const rowArray = rows.split('\\\\').filter((r: string) => r.trim());
      const tableRows = rowArray.map((row: string) => {
        const cells = row.split('&').map((cell: string) => 
          cell.replace(/\\hline/g, '').trim()
        );
        return `<tr>${cells.map(cell => `<td class="border border-border px-3 py-2">${cell}</td>`).join('')}</tr>`;
      }).join('');
      return `<table class="border-collapse border border-border my-4"><tbody>${tableRows}</tbody></table>`;
    });

    html = html.replace(/\\caption\{([^}]+)\}/g, '<p class="text-sm text-center text-muted-foreground mt-2">$1</p>');

    // Handle lists
    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
      const itemArray = items.split('\\item').filter((i: string) => i.trim());
      const listItems = itemArray.map((item: string) => `<li class="ml-4">${item.trim()}</li>`).join('');
      return `<ul class="list-disc my-4">${listItems}</ul>`;
    });

    html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      const itemArray = items.split('\\item').filter((i: string) => i.trim());
      const listItems = itemArray.map((item: string) => `<li class="ml-4">${item.trim()}</li>`).join('');
      return `<ol class="list-decimal my-4">${listItems}</ol>`;
    });

    // Handle comments
    html = html.replace(/^%.*$/gm, '<span class="text-muted-foreground text-sm italic">$&</span>');

    // Render TikZ pictures asynchronously
    const renderAllTikZ = async () => {
      for (const { placeholder, code } of tikzPictures) {
        const rendered = await renderTikZWithLocalLatex(code);
        html = html.replace(placeholder, `<div class="my-4 flex justify-center">${rendered}</div>`);
      }
      
      if (containerRef.current) {
        containerRef.current.innerHTML = html;
      }
    };

    if (tikzPictures.length > 0) {
      renderAllTikZ();
      return; // Exit early as renderAllTikZ will set the innerHTML
    }

    // Handle paragraphs
    html = html.split('\n\n').map(para => {
      const trimmed = para.trim();
      if (!trimmed || trimmed.startsWith('<') || trimmed.includes('__TIKZ_')) return trimmed;
      return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
    }).join('\n');

    containerRef.current.innerHTML = html;
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className="prose prose-slate dark:prose-invert max-w-none"
      style={{ fontFamily: 'serif' }}
    />
  );
};
