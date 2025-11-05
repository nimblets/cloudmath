import React, { useRef, useEffect, useState } from "react";
import { useBufferContext, useBuffers } from "../../state/BufferProvider";
import { BufferRenderer } from "./BufferRenderer";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

const BufferLayout: React.FC = () => {
  const { state, dispatch } = useBufferContext();
  const { updateProps } = useBuffers();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const visible = state.buffers.filter(b => b.visible !== false && b.props?.mode !== "popup");
  const previewBuf = visible.find(b => b.type === "preview");
  const editorBuf = visible.find(b => b.type === "editor");
  const calculatorBuf = visible.find(b => b.type === "calculator" && b.props?.mode !== "popup");
  // Any other non-popup, non-core buffers (tools like graph/templates) that should be shown as panels
  const sideBuf = visible.find(b => b.type !== "preview" && b.type !== "editor" && b.type !== "calculator");
  
  const previewDirection = previewBuf?.props?.direction || "vertical";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, Math.floor(r.width)), h: Math.max(1, Math.floor(r.height)) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Listen for header-dispatched events such as close and toggle-direction
  useEffect(() => {
    const onClose = (ev: Event) => {
      const detail: any = (ev as CustomEvent)?.detail || {};
      const id = detail?.bufferId;
      if (!id) return;
      dispatch({ type: "CLOSE", payload: { id } });
    };

    const onToggle = (ev: Event) => {
      const detail: any = (ev as CustomEvent)?.detail || {};
      const id = detail?.bufferId;
      if (!id) return;
      const buf = state.buffers.find(b => b.id === id);
      if (!buf) return;
      const dir = buf.props?.direction === 'horizontal' ? 'vertical' : 'horizontal';
      updateProps(id, { ...(buf.props || {}), direction: dir });
    };

    window.addEventListener('buffer:close', onClose as EventListener);
    window.addEventListener('buffer:toggleDirection', onToggle as EventListener);
    return () => {
      window.removeEventListener('buffer:close', onClose as EventListener);
      window.removeEventListener('buffer:toggleDirection', onToggle as EventListener);
    };
  }, [state.buffers, dispatch, updateProps]);

  // Don't render until we have at least one visible buffer
  if (!visible.length) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full bg-transparent p-2">
      <ResizablePanelGroup direction={previewDirection === "horizontal" ? "horizontal" : "vertical"} className="min-h-[200px] rounded-lg border">
        <ResizablePanel defaultSize={calculatorBuf ? 35 : 50} minSize={30}>
          {calculatorBuf ? (
            <ResizablePanelGroup direction={calculatorBuf.props?.direction || "horizontal"}>
              <ResizablePanel defaultSize={65} minSize={30}>
                <div 
                  className={cn(
                    "h-full w-full",
                    state.focusedId === editorBuf?.id ? "ring-1 ring-accent" : ""
                  )} 
                  onClick={() => editorBuf && dispatch({ type: "FOCUS", payload: { id: editorBuf.id } })}
                >
                  {editorBuf && <BufferRenderer buffer={editorBuf} />}
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={35} minSize={20}>
                <div 
                  className={cn(
                    "h-full w-full",
                    state.focusedId === calculatorBuf.id ? "ring-1 ring-accent" : ""
                  )}
                  onClick={() => dispatch({ type: "FOCUS", payload: { id: calculatorBuf.id } })}
                >
                  <BufferRenderer buffer={calculatorBuf} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            editorBuf && (
              <div 
                className={cn(
                  "h-full w-full",
                  state.focusedId === editorBuf.id ? "ring-1 ring-accent" : ""
                )}
                onClick={() => dispatch({ type: "FOCUS", payload: { id: editorBuf.id } })}
              >
                <BufferRenderer buffer={editorBuf} />
              </div>
            )
          )}
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={calculatorBuf ? 65 : 50} minSize={30}>
          {
            // If there's a side/tool buffer, stack it with the preview in a nested group
            sideBuf ? (
              <ResizablePanelGroup direction={previewDirection === "horizontal" ? "horizontal" : "vertical"}>
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div
                    className={cn(
                      "h-full w-full",
                      state.focusedId === sideBuf.id ? "ring-1 ring-accent" : ""
                    )}
                    onClick={() => dispatch({ type: "FOCUS", payload: { id: sideBuf.id } })}
                  >
                    <BufferRenderer buffer={sideBuf} />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={60} minSize={20}>
                  {previewBuf && (
                    <div
                      className={cn(
                        "h-full w-full",
                        state.focusedId === previewBuf.id ? "ring-1 ring-accent" : ""
                      )}
                      onClick={() => dispatch({ type: "FOCUS", payload: { id: previewBuf.id } })}
                    >
                      <BufferRenderer buffer={previewBuf} />
                    </div>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              previewBuf && (
                <div 
                  className={cn(
                    "h-full w-full",
                    state.focusedId === previewBuf.id ? "ring-1 ring-accent" : ""
                  )}
                  onClick={() => dispatch({ type: "FOCUS", payload: { id: previewBuf.id } })}
                >
                  <BufferRenderer buffer={previewBuf} />
                </div>
              )
            )
          }
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default BufferLayout;
