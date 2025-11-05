import React from "react";
import { CalculatorPane } from "./CalculatorPane";
import { CodeEditor } from "./CodeEditor";
import { EditorPane } from "./EditorPane";
import { PreviewPane } from "../preview/PreviewPane";
import { Buffer } from "../../state/BufferProvider";
import { DraggableCalculator } from "./DraggableCalculator";
import { GraphBuilder } from "@/components/tools/GraphBuilder";
import { TemplateManager } from "@/components/tools/TemplateManager";
import { BufferHeader } from "@/components/layout/BufferHeader";
import { useBuffers } from "@/state/BufferProvider";
import { createCalculatorHeader } from "./CalculatorPaneHeader";

export const BufferRenderer: React.FC<{ buffer: Buffer }> = ({ buffer }) => {
  // Special-case some buffer renderings based on props
  const p = buffer.props as any;
  const bufferProps = {
    ...p,
    'data-buffer-id': buffer.id
  };
  
  if (buffer.type === "calculator") {
    if (p?.mode === "popup") {
      return (
        <div data-buffer-id={buffer.id}>
          <DraggableCalculator {...p} bufferId={buffer.id} />
        </div>
      );
    }

    // Panel-mode calculator: centralized header + hide internal header for consistency
    const { close } = useBuffers();
    const headerProps = createCalculatorHeader({ direction: p?.direction || 'horizontal', bufferId: buffer.id, isPopup: false });

    const onHeaderAction = (action: any) => {
      switch (action.type) {
        case 'toggle-direction':
          window.dispatchEvent(new CustomEvent('calculator:requestToggleDirection', { detail: { bufferId: buffer.id } }));
          break;
        case 'pop-out':
          window.dispatchEvent(new CustomEvent('calculator:requestPopOut', { detail: { bufferId: buffer.id } }));
          break;
        case 'pop-in':
          window.dispatchEvent(new CustomEvent('calculator:requestPopIn', { detail: { bufferId: buffer.id } }));
          break;
        case 'close':
          close(buffer.id);
          break;
      }
    };

    return (
      <div className="h-full flex flex-col" data-buffer-id={buffer.id}>
        <BufferHeader {...headerProps} onHeaderAction={onHeaderAction} />
        <div className="p-2 flex-1 overflow-auto">
          <CalculatorPane {...bufferProps} hideHeader={true} />
        </div>
      </div>
    );
  }

  if (buffer.type === "code") return <CodeEditor {...bufferProps} />;
  if (buffer.type === "preview") return <PreviewPane {...bufferProps} />;
  if (buffer.type === "graph" || buffer.type === "templates") {
    // Render a unified buffer container with a BufferHeader for consistency with other panes
    const title = buffer.type === 'graph' ? 'Graph Builder' : 'Templates';
    const { close, updateProps } = useBuffers();

    const onHeaderAction = (action: any) => {
      switch (action.type) {
        case 'close':
          close(buffer.id);
          break;
        case 'pop-out':
          // Switch to popup mode so BufferPortal will render it
          updateProps(buffer.id, { ...(buffer.props || {}), mode: 'popup', visible: true });
          break;
        case 'pop-in':
          updateProps(buffer.id, { ...(buffer.props || {}), mode: 'panel', visible: true });
          break;
      }
    };

    const Content = buffer.type === 'graph' ? GraphBuilder : TemplateManager;

    return (
      <div className="h-full flex flex-col" data-buffer-id={buffer.id}>
        <BufferHeader bufferId={buffer.id} title={title} onHeaderAction={onHeaderAction} />
        <div className="p-2 flex-1 overflow-auto">
          <Content {...bufferProps} />
        </div>
      </div>
    );
  }
  if (buffer.type === "editor") {
    // Always force editor buffer to be visible
    if (!buffer.visible) buffer.visible = true;
    return <EditorPane {...p} embedded={true} />;
  }

  // Default wrapper: provide a minimal BufferHeader with close action so every buffer has a header
  const { close } = useBuffers();
  const defaultOnHeaderAction = (action: any) => {
    if (action.type === 'close') close(buffer.id);
  };

  return (
    <div className="h-full flex flex-col" data-buffer-id={buffer.id}>
      <BufferHeader bufferId={buffer.id} title={String(buffer.type)} onHeaderAction={defaultOnHeaderAction} />
      <div className="p-4 text-sm text-muted-foreground">Unknown buffer type: {String(buffer.type)}</div>
    </div>
  );
};

export default BufferRenderer;
