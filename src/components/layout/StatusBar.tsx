import React, { useEffect, useState } from "react";
import { useBufferContext } from "../../state/BufferProvider";

type WindowDescriptor = { id: string; name: string };
type Props = {
  windows?: WindowDescriptor[];
  currentWindowId?: string;
  onSwitchWindow?: (id: string) => void;
  onCreateWorkspace?: () => void;
  onRenameWorkspace?: (id: string, newName: string) => void;
};

const WorkspaceBadge: React.FC<{
  workspace: WindowDescriptor;
  active?: boolean;
  onSwitch?: () => void;
  onRename?: (newName: string) => void;
}> = ({ workspace, active, onSwitch, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(workspace.name);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const finish = () => {
    const trimmed = value.trim() || workspace.name;
    setEditing(false);
    if (trimmed !== workspace.name) onRename?.(trimmed);
  };

  return (
    <div className={`font-mono text-xs ${active ? 'bg-orange-500 text-white' : 'text-muted-foreground'} px-2 py-0.5 rounded`}>
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') { setEditing(false); setValue(workspace.name); }
          }}
          className="bg-transparent outline-none w-[90px] text-xs font-mono"
        />
      ) : (
        <button onClick={onSwitch} onDoubleClick={() => setEditing(true)} className="min-w-[72px] text-left">
          [{workspace.name}]
        </button>
      )}
    </div>
  );
};

export const StatusBar: React.FC<Props> = ({ windows = [], currentWindowId, onSwitchWindow, onCreateWorkspace, onRenameWorkspace }) => {
  const { state } = useBufferContext();
  const [cursor, setCursor] = useState<{ lineNumber: number; column: number } | null>(null);
  const [contentLen, setContentLen] = useState<number | null>(null);

  useEffect(() => {
    const onCursor = (e: Event) => {
      const ev = e as CustomEvent;
      if (ev?.detail) {
        setCursor({ lineNumber: ev.detail.lineNumber, column: ev.detail.column });
      }
    };
    const onContent = (e: Event) => {
      const ev = e as CustomEvent;
      if (ev?.detail) setContentLen(ev.detail.length);
    };

    window.addEventListener("monaco:cursor", onCursor as EventListener);
    window.addEventListener("monaco:content", onContent as EventListener);
    return () => {
      window.removeEventListener("monaco:cursor", onCursor as EventListener);
      window.removeEventListener("monaco:content", onContent as EventListener);
    };
  }, []);

  const focused = state.focusedId || "(none)";
  const buffers = state.buffers.length;

  return (
    <div className="w-full border-t border-border bg-card text-xs text-muted-foreground h-6 flex items-center px-3 justify-between">
      <div className="flex items-center gap-3">
        <div className="font-mono">Focused: <span className="font-semibold">{focused}</span></div>
        <div className="font-mono">Buffers: <span className="font-semibold">{buffers}</span></div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {windows.map(w => (
            <WorkspaceBadge
              key={w.id}
              workspace={w}
              active={w.id === currentWindowId}
              onSwitch={() => onSwitchWindow?.(w.id)}
              onRename={(newName) => onRenameWorkspace?.(w.id, newName)}
            />
          ))}

          <button
            onClick={() => onCreateWorkspace?.()}
            className="font-mono px-2 py-0.5 text-xs bg-transparent hover:bg-muted/10 rounded"
            title="New workspace"
          >
            +
          </button>
        </div>

        <div className="font-mono">{cursor ? `Ln ${cursor.lineNumber}, Col ${cursor.column}` : "Ln -, Col -"}</div>
        <div className="font-mono">{contentLen != null ? `${contentLen} chars` : "- chars"}</div>
      </div>
    </div>
  );
};

export default StatusBar;
