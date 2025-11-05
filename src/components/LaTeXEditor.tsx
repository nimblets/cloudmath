import React, { useEffect, useState } from "react";
import { Header } from "./layout/Header";
import BufferLayout from "./editor/BufferLayout";
import StatusBar from "./layout/StatusBar";
import { useBuffers, useBufferContext } from "../state/BufferProvider";

export interface Document {
  id: string;
  title: string;
  content: string;
}

export const LaTeXEditor: React.FC = () => {
  // initial document template
  const initialDoc: Document = {
    id: "1",
    title: "untitled.tex",
    content: `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{My Document}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{Introduction}

This is a sample LaTeX document. Write your math equations here:

\\[
  f(x) = \\\\int_{-\\\\infty}^{\\\\infty} e^{-x^2} dx = \\\\sqrt{\\\\pi}
\\]

\\subsection{More Math}

Inline math: $E = mc^2$ and display math:

\\begin{align}
  a^2 + b^2 &= c^2 \\\\ 
\\end{align}

\\end{document}`
  };

  // Window model: each window holds its own documents and activeDocId
  const [windows, setWindows] = useState<Array<{ id: string; name: string; documents: Document[]; activeDocId: string }>>([
    { id: "window-1", name: "window1", documents: [initialDoc], activeDocId: initialDoc.id }
  ]);
  const [currentWindowId, setCurrentWindowId] = useState<string>("window-1");

  const currentWindow = windows.find(w => w.id === currentWindowId) || windows[0];
  const activeDoc = currentWindow.documents.find(d => d.id === currentWindow.activeDocId) || currentWindow.documents[0];

  const { open, close, buffers, updateProps } = useBuffers();
  const { state } = useBufferContext();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [borderRadius, setBorderRadius] = useState<number>(4);

  // Helper: update activeDocId for a window
  const setActiveDocIdForWindow = (windowId: string, docId: string) => {
    setWindows(ws => ws.map(w => w.id === windowId ? { ...w, activeDocId: docId } : w));
  };

  // Helper: update a document's content in current window
  const updateDocContent = (id: string, content: string) => {
    setWindows(ws => ws.map(w => {
      if (w.id !== currentWindowId) return w;
      return { ...w, documents: w.documents.map(d => d.id === id ? { ...d, content } : d) };
    }));
  };

  // Add a new document to the current window and switch to it
  const addNewDocument = () => {
    const newId = String(Date.now());
    const newDoc: Document = {
      id: newId,
      title: `untitled-${currentWindow.documents.length + 1}.tex`,
      content: `\\documentclass{article}\n\n\\begin{document}\n\n% Start writing here\n\n\\end{document}`
    };

    setWindows(ws => ws.map(w => {
      if (w.id !== currentWindowId) return w;
      return { ...w, documents: [...w.documents, newDoc], activeDocId: newId };
    }));
  };

  const renameDocument = (id: string, newTitle: string) => {
    setWindows(ws => ws.map(w => {
      if (w.id !== currentWindowId) return w;
      return { ...w, documents: w.documents.map(d => d.id === id ? { ...d, title: newTitle } : d) };
    }));
  };

  const closeDocument = (id: string) => {
    setWindows(ws => ws.map(w => {
      if (w.id !== currentWindowId) return w;
      if (w.documents.length === 1) return w; // keep at least one
      const newDocs = w.documents.filter(d => d.id !== id);
      const newActive = w.activeDocId === id ? newDocs[0].id : w.activeDocId;
      return { ...w, documents: newDocs, activeDocId: newActive };
    }));
  };

  // Create a new window with default layout and switch to it
  const createNewWindow = () => {
    const idx = windows.length + 1;
    const id = `window-${idx}`;
    const w = { id, name: `window${idx}`, documents: [initialDoc], activeDocId: initialDoc.id };
    setWindows(ws => [...ws, w]);
    setCurrentWindowId(id);
  };

  const renameWindow = (id: string, newName: string) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, name: newName } : w));
  };

  const importText = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/plain,.tex';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const newId = String(Date.now());
      const newDoc: Document = { id: newId, title: file.name || `import-${newId}.tex`, content: text };
      // add into current window
      setWindows(ws => ws.map(w => w.id === currentWindowId ? { ...w, documents: [...w.documents, newDoc], activeDocId: newId } : w));
    };
    input.click();
  };

  const exportPDF = () => {
    // Basic export: open a new window with the preview content and call print.
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;
    const previewContent = currentWindow.documents.find(d => d.id === currentWindow.activeDocId)?.content || '';
    previewWindow.document.write(`<pre>${previewContent.replace(/</g, '&lt;')}</pre>`);
    previewWindow.document.close();
    setTimeout(() => previewWindow.print(), 300);
  };

  // Switch to an existing window
  const switchWindow = (id: string) => {
    const exists = windows.some(w => w.id === id);
    if (exists) setCurrentWindowId(id);
  };

  // Initialize core buffers (editor + preview) on first mount
  useEffect(() => {
    const savedState = localStorage.getItem("editor:layout");
    const defaultLayout = { previewDirection: "horizontal" };
    const layout = savedState ? JSON.parse(savedState) : defaultLayout;

    const needsSetup = !buffers.some(b => b.id === "editor:main" || b.id === "preview:main");

    // Ensure no calculator buffers are open on initial load
    buffers.filter(b => b.type === 'calculator').forEach(b => {
      try { close(b.id); } catch { /* ignore */ }
    });

    if (needsSetup) {
      open({
        id: "editor:main",
        type: "editor",
        props: {
          documents: currentWindow.documents,
          activeDocId: currentWindow.activeDocId,
          onDocumentChange: (id: string) => setActiveDocIdForWindow(currentWindowId, id),
          onContentChange: updateDocContent,
          onNewDocument: addNewDocument,
          onRenameDocument: renameDocument,
          onCloseDocument: closeDocument,
        },
        visible: true,
        reuse: true,
      });

      open({
        id: "preview:main",
        type: "preview",
        props: {
          content: activeDoc.content,
          direction: layout.previewDirection,
          onToggleDirection: () => {
            const pb = buffers.find(b => b.id === "preview:main");
            if (pb) {
              const newDir = pb.props?.direction === "horizontal" ? "vertical" : "horizontal";
              updateProps(pb.id, { direction: newDir, content: activeDoc.content });
              localStorage.setItem("editor:layout", JSON.stringify({ previewDirection: newDir }));
            }
          }
        },
        visible: true,
        reuse: true,
      });
    }
  }, []);

  // Sync editor + preview buffer props when current window changes
  useEffect(() => {
    const editorBuf = buffers.find(b => b.id === "editor:main");
    if (editorBuf) {
      updateProps(editorBuf.id, {
        documents: currentWindow.documents,
        activeDocId: currentWindow.activeDocId,
        onDocumentChange: (id: string) => setActiveDocIdForWindow(currentWindowId, id),
        onContentChange: updateDocContent,
        onNewDocument: addNewDocument,
        onRenameDocument: renameDocument,
        onCloseDocument: closeDocument,
      });
    }

    const previewBuf = buffers.find(b => b.id === "preview:main");
    if (previewBuf) {
      updateProps(previewBuf.id, { content: activeDoc.content, direction: previewBuf.props?.direction || "horizontal" });
    }
  }, [currentWindowId, windows]);

  // Keep preview content up to date when active document changes
  useEffect(() => {
    const pb = buffers.find(b => b.id === "preview:main");
    if (pb) updateProps(pb.id, { content: activeDoc.content });
  }, [activeDoc.content, buffers]);

  // Keyboard handlers and other buffer-related effects are preserved as before
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod || !e.shiftKey) return;

      // Ctrl/Cmd+Shift+P => toggle preview direction
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const pb = buffers.find(b => b.id === "preview:main");
        if (pb) {
          const dir = pb.props?.direction === 'horizontal' ? 'vertical' : 'horizontal';
          updateProps(pb.id, { direction: dir, content: activeDoc.content });
        }
      }

      // Ctrl/Cmd+Shift+C => toggle calculator or change direction based on focus
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const cb = buffers.find(b => b.id === "calculator:tiled");
        const cp = buffers.find(b => b.id === "calculator:popup");

        if (state.focusedId === "calculator:tiled" && cb) {
          const newDir = cb.props?.direction === "horizontal" ? "vertical" : "horizontal";
          updateProps(cb.id, { ...cb.props, direction: newDir });
          return;
        }

        if (!cb && !cp) {
          open({
            id: "calculator:popup",
            type: "calculator",
            props: {
              mode: "popup",
              onInsertResult: (result: string) => {
                const evt = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
                evt.clipboardData?.setData('text', result);
                document.dispatchEvent(evt);
              }
            },
            reuse: true,
            visible: true
          });
        } else if (cp) {
          close("calculator:popup");
          const initialDir = "horizontal";
          open({
            id: "calculator:tiled",
            type: "calculator",
            props: {
              mode: "panel",
              onInsertResult: (result: string) => {
                const evt = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
                evt.clipboardData?.setData('text', result);
                document.dispatchEvent(evt);
              },
              direction: initialDir,
              onToggleDirection: () => {
                const calc = buffers.find(b => b.id === "calculator:tiled");
                if (calc) {
                  const newDir = calc.props?.direction === "horizontal" ? "vertical" : "horizontal";
                  updateProps("calculator:tiled", { ...calc.props, direction: newDir });
                }
              }
            },
            reuse: true,
            visible: true
          });
        } else if (cb) {
          close("calculator:tiled");
          open({
            id: "calculator:popup",
            type: "calculator",
            props: {
              mode: "popup",
              onInsertResult: cb.props?.onInsertResult,
            },
            reuse: true,
            visible: true
          });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [buffers, open, close, updateProps, activeDoc.content, state.focusedId]);

  // Listen for calculator pop-in/pop-out/toggle events (preserve prior behavior)
  useEffect(() => {
    const reqHandler = (ev: Event) => {
      const cp = buffers.find((b) => b.id === "calculator:popup");
      if (cp) {
        close("calculator:popup");
        const initialDir = "horizontal";
        open({
          id: "calculator:tiled",
          type: "calculator",
          props: {
            mode: "panel",
            onInsertResult: (result: string) => {
              const evt = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
              evt.clipboardData?.setData('text', result);
              document.dispatchEvent(evt);
            },
            direction: initialDir,
            onToggleDirection: () => {
              const calc = buffers.find((b) => b.id === "calculator:tiled");
              if (calc) {
                const newDir = calc.props?.direction === "horizontal" ? "vertical" : "horizontal";
                updateProps("calculator:tiled", { ...calc.props, direction: newDir });
              }
            },
            onClose: () => close("calculator:tiled")
          },
          reuse: true,
          visible: true,
        });
      }
    };

    window.addEventListener("calculator:requestPopIn", reqHandler as EventListener);
    return () => window.removeEventListener("calculator:requestPopIn", reqHandler as EventListener);
  }, [buffers, open, close, updateProps]);

  useEffect(() => {
    const req = (ev: Event) => {
      const cb = buffers.find((b) => b.id === "calculator:tiled");
      if (!cb) return;
      close("calculator:tiled");
      open({ id: "calculator:popup", type: "calculator", props: { mode: "popup", onInsertResult: cb.props?.onInsertResult }, reuse: true, visible: true });
    };
    window.addEventListener("calculator:requestPopOut", req as EventListener);
    return () => window.removeEventListener("calculator:requestPopOut", req as EventListener);
  }, [buffers, open, close]);

  useEffect(() => {
    const req = (ev: Event) => {
      const calc = buffers.find((b) => b.id === "calculator:tiled");
      if (!calc) return;
      const newDir = calc.props?.direction === "horizontal" ? "vertical" : "horizontal";
      updateProps("calculator:tiled", { ...calc.props, direction: newDir });
    };
    window.addEventListener("calculator:requestToggleDirection", req as EventListener);
    return () => window.removeEventListener("calculator:requestToggleDirection", req as EventListener);
  }, [buffers, updateProps]);

  useEffect(() => {
    const req = (ev: Event) => {
      const preview = buffers.find((b) => b.id === "preview:main");
      if (!preview) return;
      const newDir = preview.props?.direction === "horizontal" ? "vertical" : "horizontal";
      updateProps(preview.id, { ...preview.props, direction: newDir });
      localStorage.setItem("editor:layout", JSON.stringify({ previewDirection: newDir }));
    };
    window.addEventListener("preview:requestToggleDirection", req as EventListener);
    return () => window.removeEventListener("preview:requestToggleDirection", req as EventListener);
  }, [buffers, updateProps]);

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`} style={{ "--radius": `${borderRadius}px` } as React.CSSProperties}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header
          theme={theme}
          onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
          borderRadius={borderRadius}
          onBorderRadiusChange={setBorderRadius}
          onInsertCode={(code) => updateDocContent(activeDoc.id, activeDoc.content + "\n" + code)}
          onNewWindow={createNewWindow}
          onImportText={importText}
          onExportPDF={exportPDF}
        />
        <div className="flex-1 min-h-0">
          <BufferLayout />
        </div>

        {/* status bar shows windows and buffer info; pass windows for rendering */}
        {/* StatusBar: show workspaces and allow switching/creation/rename */}
        <StatusBar
          // @ts-ignore - props are partially typed elsewhere
          windows={windows.map(w => ({ id: w.id, name: w.name }))}
          currentWindowId={currentWindowId}
          onSwitchWindow={switchWindow}
          onCreateWorkspace={createNewWindow}
          onRenameWorkspace={renameWindow}
        />
      </div>
    </div>
  );
};

export default LaTeXEditor;

