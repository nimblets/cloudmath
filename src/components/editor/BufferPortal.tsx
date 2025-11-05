import React from "react";
import { createPortal } from "react-dom";
import { useBufferContext } from "../../state/BufferProvider";
import { BufferRenderer } from "./BufferRenderer";

export const BufferPortal: React.FC = () => {
  const { state } = useBufferContext();

  if (typeof document === "undefined") return null;

  const popups = state.buffers.filter((b) => b.visible !== false && b.props?.mode === "popup");
  if (popups.length === 0) return null;

  return createPortal(
    <>
      {popups.map((buf) => (
        <div key={buf.id} data-buffer-portal={buf.id}>
          <BufferRenderer buffer={buf} />
        </div>
      ))}
    </>,
    document.body
  );
};

export default BufferPortal;
