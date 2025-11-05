import { useState, useRef, useEffect } from "react";
import { TabBar } from "./TabBar";
import { CodeEditor, type CodeEditorRef } from "./CodeEditor";
import { SymbolBar } from "./SymbolBar";
import { CalculatorPane } from "./CalculatorPane";
import { DraggableCalculator } from "./DraggableCalculator";
import { CommandPalette } from "./CommandPalette";
import { useBuffers } from "../../state/BufferProvider";
import { BufferRenderer } from "./BufferRenderer";
import type { Document } from "../LaTeXEditor";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PreviewPane } from "../preview/PreviewPane";
import { Calculator } from "lucide-react";
import { BufferHeader } from "@/components/layout/BufferHeader";
interface EditorPaneProps {
  documents: Document[];
  activeDocId: string;
  onDocumentChange: (id: string) => void;
  onContentChange: (id: string, content: string) => void;
  onNewDocument: () => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onCloseDocument: (id: string) => void;
  embedded?: boolean; // when true, omit inline preview — BufferLayout renders preview
}
export const EditorPane = ({
  documents,
  activeDocId,
  onDocumentChange,
  onContentChange,
  onNewDocument,
  onRenameDocument,
  onCloseDocument,
  embedded = false
}: EditorPaneProps) => {
  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDirection, setCalcDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [previewDirection, setPreviewDirection] = useState<"horizontal" | "vertical">("vertical");
  const [calcMode, setCalcMode] = useState<"panel" | "popup">("panel");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const editorRef = useRef<CodeEditorRef>(null);
  const { open, close, buffers, updateProps } = useBuffers();
  const previewBuf = buffers.find(b => b.type === "preview");

  useEffect(() => {
    if (previewBuf) {
      updateProps(previewBuf.id, { content: activeDoc.content });
    }
  }, [activeDoc.content, previewBuf?.id]);

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
  // Decide whether to show both editor and preview in a split view or just the editor
  const EditorContent = (
    <div className="flex flex-col h-full">
      <BufferHeader
        title="Editor"
        tabs={documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          active: doc.id === activeDocId,
          closeable: documents.length > 1,
          editable: true,
          onClick: () => onDocumentChange(doc.id),
          onClose: () => onCloseDocument(doc.id),
          onRename: (newTitle) => onRenameDocument(doc.id, newTitle)
        }))}
        onNewTab={onNewDocument}
        right={{
          actions: [
            {
              type: 'custom',
              icon: <Calculator className="h-4 w-4" />,
              title: "Toggle Calculator",
              onClick: () => {
                const tiledCalc = buffers.find(b => b.id === "calculator:tiled");
                const popupCalc = buffers.find(b => b.id === "calculator:popup");

                if (tiledCalc) {
                  close("calculator:tiled");
                  setCalcMode("panel");
                } else if (popupCalc) {
                  // Convert popup to tiled
                  close("calculator:popup");
                  open({
                    id: "calculator:tiled",
                    type: "calculator",
                    props: {
                      mode: "panel",
                      onInsertResult: insertSymbol,
                      onClose: () => {
                        close("calculator:tiled");
                        setCalcMode("panel");
                      },
                      direction: calcDirection,
                      onToggleDirection: () => setCalcDirection(d => d === "horizontal" ? "vertical" : "horizontal")
                    },
                    reuse: true
                  });
                  setCalcMode("panel");
                } else {
                  // Open new tiled calculator
                  open({
                    id: "calculator:tiled",
                    type: "calculator",
                    props: {
                      mode: "panel",
                      onInsertResult: insertSymbol,
                      onClose: () => {
                        close("calculator:tiled");
                        setCalcMode("panel");
                      },
                      direction: calcDirection,
                      onToggleDirection: () => setCalcDirection(d => d === "horizontal" ? "vertical" : "horizontal")
                    },
                    reuse: true
                  });
                }
              },
              order: 97
            }
          ]
        }}
      />

      <div className="flex-1 overflow-hidden">
        <CodeEditor ref={editorRef} value={activeDoc.content} onChange={value => onContentChange(activeDocId, value)} />
      </div>

      <SymbolBar onInsertSymbol={insertSymbol} />
    </div>
  );

  // When embedded is true, only show the editor content
  if (embedded) {
    return (
      <>
        {EditorContent}
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onSelect={insertSymbol} />
      </>
    );
  }

  // Otherwise show the full split view with preview
  return (
    <>
      <ResizablePanelGroup direction={outerDirection} className="flex-1">
        <ResizablePanel defaultSize={50} minSize={25}>
          {showCalculator && calcMode === "panel" ? (
            <ResizablePanelGroup direction={innerDirection}>
              <ResizablePanel defaultSize={65} minSize={30}>
                {EditorContent}
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
                <CalculatorPane
                  onInsertResult={insertSymbol}
                  onClose={() => setShowCalculator(false)}
                  direction={calcDirection}
                  onToggleDirection={() => setCalcDirection(d => (d === "horizontal" ? "vertical" : "horizontal"))}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            EditorContent
          )}
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          {previewBuf ? (
            <BufferRenderer buffer={previewBuf} />
          ) : (
            <PreviewPane
              content={activeDoc.content}
              direction={previewDirection}
              onToggleDirection={() => {
                const newDir = previewDirection === "horizontal" ? "vertical" : "horizontal";
                setPreviewDirection(newDir);
                if (previewBuf) {
                  updateProps(previewBuf.id, { direction: newDir });
                } else {
                  open({
                    id: "preview:main",
                    type: "preview",
                    props: { content: activeDoc.content, direction: newDir, onToggleDirection: () => {} },
                    reuse: true
                  });
                }
              }}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} onSelect={insertSymbol} />
    </>
  );
};