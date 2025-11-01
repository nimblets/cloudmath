import { ScrollArea } from "@/components/ui/scroll-area";
import { LaTeXRenderer } from "./LaTeXRenderer";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface PreviewPaneProps {
  content: string;
  direction?: "horizontal" | "vertical";
  onToggleDirection?: () => void;
}

export const PreviewPane = ({ content, direction = "vertical", onToggleDirection }: PreviewPaneProps) => {
  const handleExportPDF = () => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    const previewContent = document.querySelector('.preview-content')?.innerHTML || '';
    
    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LaTeX Document</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 1in;
              line-height: 1.6;
            }
            a {
              color: inherit;
              text-decoration: none;
            }
            @media print {
              body { margin: 0.5in; }
              a[href]:after { content: none !important; }
              nav, .no-print { display: none !important; }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>${previewContent}</body>
      </html>
    `);
    previewWindow.document.close();
    
    setTimeout(() => {
      previewWindow.print();
      toast.success("Opening print dialog for PDF export");
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col bg-card">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary">
        <span className="text-sm font-medium">Preview</span>
        <div className="flex gap-1">
          {onToggleDirection && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onToggleDirection}
              title="Toggle Preview Direction"
            >
              <span className="text-xs">{direction === "horizontal" ? "⇅" : "⇄"}</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleExportPDF}
            className="h-8"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-8 max-w-4xl mx-auto preview-content">
          <LaTeXRenderer content={content} />
        </div>
      </ScrollArea>
    </div>
  );
};
