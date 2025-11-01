import { useState, useRef, useEffect } from "react";
import { TabBar } from "./TabBar";
import { CodeEditor, type CodeEditorRef } from "./CodeEditor";
import { SymbolBar } from "./SymbolBar";
import { CalculatorPane } from "./CalculatorPane";
import { DraggableCalculator } from "./DraggableCalculator";
import { CommandPalette } from "./CommandPalette";
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
  onCloseDocument
}: EditorPaneProps) => {
  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDirection, setCalcDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [previewDirection, setPreviewDirection] = useState<"horizontal" | "vertical">("vertical");
  const [calcMode, setCalcMode] = useState<"panel" | "popup">("panel");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const editorRef = useRef<CodeEditorRef>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd+K for command palette
      if (modKey && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Don't handle other shortcuts if not in editor
      if (!editorRef.current) return;

      // Ctrl shortcuts
      if (modKey && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '/':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\frac{}{}');
            break;
          case 'i':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\int');
            break;
          case 's':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\sum');
            break;
          case 'p':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\prod');
            break;
          case 'r':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\sqrt{}');
            break;
          case '8':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\infty');
            break;
          case 'd':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\partial');
            break;
          case 'n':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\nabla');
            break;
          case 'l':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\lim_{}');
            break;
          case 'e':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\in');
            break;
          case 'a':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\forall');
            break;
        }
      }

      // Ctrl+Shift shortcuts
      if (modKey && e.shiftKey && !e.altKey) {
        switch (e.key) {
          case 'D':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\frac{d}{dx}');
            break;
          case 'E':
            e.preventDefault();
            editorRef.current.insertAtCursor('\n\\[\n  \n\\]\n');
            break;
          case 'A':
            e.preventDefault();
            editorRef.current.insertAtCursor('\n\\begin{align}\n  \n\\end{align}\n');
            break;
          case 'M':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\begin{bmatrix}\n  \n\\end{bmatrix}');
            break;
          case 'C':
            e.preventDefault();
            editorRef.current.insertAtCursor('\\begin{cases}\n  \n\\end{cases}');
            break;
        }
      }

      // Alt shortcuts (Greek letters)
      if (e.altKey && !modKey && !e.shiftKey) {
        const greekMap: Record<string, string> = {
          'a': '\\alpha',
          'b': '\\beta',
          'g': '\\gamma',
          'd': '\\delta',
          'e': '\\epsilon',
          't': '\\theta',
          'l': '\\lambda',
          'm': '\\mu',
          'p': '\\pi',
          's': '\\sigma',
          'f': '\\phi',
          'o': '\\omega'
        };
        if (greekMap[e.key.toLowerCase()]) {
          e.preventDefault();
          editorRef.current.insertAtCursor(greekMap[e.key.toLowerCase()]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const insertSymbol = (symbol: string) => {
    editorRef.current?.insertAtCursor(symbol);
  };

  // Determine the outer panel group direction
  const outerDirection = previewDirection === "horizontal" && showCalculator && calcMode === "panel" ? "vertical" : "horizontal";

  // Determine the inner (editor+calc) panel group direction
  const innerDirection = calcDirection;
  return <>
      <ResizablePanelGroup direction={outerDirection} className="flex-1">
        <ResizablePanel defaultSize={50} minSize={25}>
          {showCalculator && calcMode === "panel" ? <ResizablePanelGroup direction={innerDirection}>
              <ResizablePanel defaultSize={65} minSize={30}>
                <div className="flex flex-col h-full">
            <div className="flex items-center bg-secondary border-b border-border h-10">
              <div className="flex-1 overflow-x-auto">
                <div className="flex items-center h-full">
                  {documents.map(doc => <div key={doc.id} className={`flex items-center gap-1 px-3 h-full border-r border-border cursor-pointer group ${doc.id === activeDocId ? "bg-card" : "hover:bg-card/50"}`} onClick={() => onDocumentChange(doc.id)}>
                      <span className="text-xs font-mono truncate max-w-[120px]">
                        {doc.title}
                      </span>
                      {documents.length > 1 && <button onClick={e => {
                        e.stopPropagation();
                        onCloseDocument(doc.id);
                      }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 hover:text-destructive" />
                        </button>}
                    </div>)}
                  
                  <Button variant="ghost" size="sm" onClick={onNewDocument} className="h-8 ml-1">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                    if (calcMode === "panel") {
                      setCalcMode("popup");
                      setShowCalculator(true);
                    } else {
                      setCalcMode("panel");
                    }
                  }} title="Pop Out Calculator">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                    setShowCalculator(!showCalculator);
                    // Reset to panel mode when hiding calculator if it was in popup mode
                    if (!showCalculator) {
                      setCalcMode("panel");
                    }
                  }} title="Toggle Calculator">
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>
          
          <div className="flex-1 overflow-hidden">
            <CodeEditor ref={editorRef} value={activeDoc.content} onChange={value => onContentChange(activeDocId, value)} />
          </div>
          
          <SymbolBar onInsertSymbol={insertSymbol} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle />
              
              <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
                <CalculatorPane onInsertResult={insertSymbol} onClose={() => setShowCalculator(false)} direction={calcDirection} onToggleDirection={() => setCalcDirection(d => d === "horizontal" ? "vertical" : "horizontal")} />
              </ResizablePanel>
            </ResizablePanelGroup> : <div className="flex flex-col h-full">
              <div className="flex items-center bg-secondary border-b border-border h-10 mx-0 my-0 py-[24px]">
                <div className="flex-1 overflow-x-auto">
                  <div className="flex items-center h-full">
                    {documents.map(doc => <div key={doc.id} className={`flex items-center gap-1 px-3 h-full border-r border-border cursor-pointer group ${doc.id === activeDocId ? "bg-card" : "hover:bg-card/50"}`} onClick={() => onDocumentChange(doc.id)}>
                        <span className="text-xs font-mono truncate max-w-[120px]">
                          {doc.title}
                        </span>
                        {documents.length > 1 && <button onClick={e => {
                    e.stopPropagation();
                    onCloseDocument(doc.id);
                  }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3 hover:text-destructive" />
                          </button>}
                      </div>)}
                    
                    <Button variant="ghost" size="sm" onClick={onNewDocument} className="h-8 ml-1">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                if (calcMode === "panel") {
                  setCalcMode("popup");
                  setShowCalculator(true);
                } else {
                  setCalcMode("panel");
                }
              }} title="Pop Out Calculator">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                setShowCalculator(!showCalculator);
                // Reset to panel mode when hiding calculator if it was in popup mode
                if (!showCalculator) {
                  setCalcMode("panel");
                }
              }} title="Toggle Calculator">
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            
              <div className="flex-1 overflow-hidden">
                <CodeEditor ref={editorRef} value={activeDoc.content} onChange={value => onContentChange(activeDocId, value)} />
              </div>
              
              <SymbolBar onInsertSymbol={insertSymbol} />
            </div>}
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={50} minSize={30}>
          <PreviewPane content={activeDoc.content} direction={previewDirection} onToggleDirection={() => setPreviewDirection(d => d === "horizontal" ? "vertical" : "horizontal")} />
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {showCalculator && calcMode === "popup" && <DraggableCalculator onInsertResult={insertSymbol} onClose={() => setShowCalculator(false)} />}
      
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onSelect={insertSymbol} />
    </>;
};