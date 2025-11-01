import { useState } from "react";
import { TabBar } from "./TabBar";
import { CodeEditor } from "./CodeEditor";
import { SymbolBar } from "./SymbolBar";
import { CalculatorPane } from "./CalculatorPane";
import { DraggableCalculator } from "./DraggableCalculator";
import type { Document } from "../LaTeXEditor";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PreviewPane } from "../preview/PreviewPane";
import { Button } from "@/components/ui/button";
import { Calculator, X, Plus, Maximize2 } from "lucide-react";

interface EditorPaneProps {
  documents: Document[];
  activeDocId: string;
  onDocumentChange: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onNewDocument: () => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onCloseDocument: (id: string) => void;
}

export const EditorPane = ({
  documents,
  activeDocId,
  onDocumentChange,
  onContentChange,
  onNewDocument,
  onRenameDocument,
  onCloseDocument,
}: EditorPaneProps) => {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDirection, setCalcDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [previewDirection, setPreviewDirection] = useState<"horizontal" | "vertical">("vertical");
  const [calcMode, setCalcMode] = useState<"panel" | "popup">("panel");

  const insertSymbol = (symbol: string) => {
    // For now, just append to end. In future, insert at cursor position
    onContentChange(activeDocId, activeDoc.content + symbol);
  };

  // Determine the outer panel group direction
  const outerDirection = previewDirection === "horizontal" && showCalculator && calcMode === "panel" 
    ? "vertical" 
    : "horizontal";
  
  // Determine the inner (editor+calc) panel group direction
  const innerDirection = calcDirection;

  return (
    <>
      <ResizablePanelGroup direction={outerDirection} className="flex-1">
        <ResizablePanel defaultSize={50} minSize={25}>
          {showCalculator && calcMode === "panel" ? (
            <ResizablePanelGroup direction={innerDirection}>
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="flex flex-col h-full">
            <div className="flex items-center bg-secondary border-b border-border h-10">
              <div className="flex-1 overflow-x-auto">
                <div className="flex items-center h-full">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-1 px-3 h-full border-r border-border cursor-pointer group ${
                        doc.id === activeDocId ? "bg-card" : "hover:bg-card/50"
                      }`}
                      onClick={() => onDocumentChange(doc.id)}
                    >
                      <span className="text-xs font-mono truncate max-w-[120px]">
                        {doc.title}
                      </span>
                      {documents.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseDocument(doc.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 hover:text-destructive" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNewDocument}
                    className="h-8 ml-1"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    if (calcMode === "panel") {
                      setCalcMode("popup");
                      setShowCalculator(true);
                    } else {
                      setCalcMode("panel");
                    }
                  }}
                  title="Pop Out Calculator"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setShowCalculator(!showCalculator);
                    // Reset to panel mode when hiding calculator if it was in popup mode
                    if (!showCalculator) {
                      setCalcMode("panel");
                    }
                  }}
                  title="Toggle Calculator"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>
          
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={activeDoc.content}
              onChange={(value) => onContentChange(activeDocId, value)}
            />
          </div>
          
          <SymbolBar onInsertSymbol={insertSymbol} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle />
              
              <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
                <CalculatorPane 
                  onInsertResult={insertSymbol} 
                  onClose={() => setShowCalculator(false)}
                  direction={calcDirection}
                  onToggleDirection={() => setCalcDirection(d => d === "horizontal" ? "vertical" : "horizontal")}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center bg-secondary border-b border-border h-10">
                <div className="flex-1 overflow-x-auto">
                  <div className="flex items-center h-full">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-1 px-3 h-full border-r border-border cursor-pointer group ${
                          doc.id === activeDocId ? "bg-card" : "hover:bg-card/50"
                        }`}
                        onClick={() => onDocumentChange(doc.id)}
                      >
                        <span className="text-xs font-mono truncate max-w-[120px]">
                          {doc.title}
                        </span>
                        {documents.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseDocument(doc.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onNewDocument}
                      className="h-8 ml-1"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      if (calcMode === "panel") {
                        setCalcMode("popup");
                        setShowCalculator(true);
                      } else {
                        setCalcMode("panel");
                      }
                    }}
                    title="Pop Out Calculator"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setShowCalculator(!showCalculator);
                      // Reset to panel mode when hiding calculator if it was in popup mode
                      if (!showCalculator) {
                        setCalcMode("panel");
                      }
                    }}
                    title="Toggle Calculator"
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={activeDoc.content}
                  onChange={(value) => onContentChange(activeDocId, value)}
                />
              </div>
              
              <SymbolBar onInsertSymbol={insertSymbol} />
            </div>
          )}
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={50} minSize={30}>
          <PreviewPane 
            content={activeDoc.content}
            direction={previewDirection}
            onToggleDirection={() => setPreviewDirection(d => d === "horizontal" ? "vertical" : "horizontal")}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {showCalculator && calcMode === "popup" && (
        <DraggableCalculator
          onInsertResult={insertSymbol}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </>
  );
};
