import { ScrollArea } from "@/components/ui/scroll-area";
import { LaTeXRenderer } from "./LaTeXRenderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

interface PreviewPaneProps {
  content: string;
}

export const PreviewPane = ({ content }: PreviewPaneProps) => {
  const handleExportPDF = () => {
    // Create a new window with only the preview content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    // Get the preview content
    const previewContent = document.querySelector('.prose')?.innerHTML || '';
    
    // Write the content to the new window with proper styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export PDF</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">
          <style>
            body {
              font-family: serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
            }
            @media print {
              body { margin: 0; padding: 1rem; }
            }
          </style>
        </head>
        <body>${previewContent}</body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    setTimeout(() => {
      printWindow.print();
      toast.success("Opening print dialog for PDF export");
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col bg-card">
      <div className="h-10 border-b border-border flex items-center justify-between px-4">
        <span className="text-xs font-mono text-muted-foreground">Preview</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleExportPDF}
          className="h-7 text-xs"
        >
          <FileDown className="h-3 w-3 mr-1" />
          Export PDF
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-8 max-w-4xl mx-auto">
          <LaTeXRenderer content={content} />
        </div>
      </ScrollArea>
    </div>
  );
};
