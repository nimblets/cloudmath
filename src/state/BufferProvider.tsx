import React, { createContext, useContext, useEffect, useReducer } from "react";

export type BufferType =
  | "calculator"
  | "code"
  | "preview"
  | "editor"
  | "graph"
  | "template"
  | "tools"
  | string;

export interface Buffer {
  id: string;
  type: BufferType;
  title?: string;
  props?: Record<string, any>;
  pinned?: boolean;
  visible?: boolean;
  createdAt: number;
}

type State = {
  buffers: Buffer[];
  focusedId?: string | null;
};

type Action =
  | { type: "OPEN"; payload: Partial<Buffer> & { reuse?: boolean; id?: string } }
  | { type: "CLOSE"; payload: { id: string } }
  | { type: "FOCUS"; payload: { id: string } }
  | { type: "TOGGLE_VISIBILITY"; payload: { id: string } }
  | { type: "UPDATE_PROPS"; payload: { id: string; props: Record<string, any> } }
  | { type: "SET"; payload: State };

const initialState: State = { buffers: [], focusedId: null };

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN": {
      const payload = action.payload;
      if (payload.reuse) {
        const found = state.buffers.find(
          (b) => b.type === payload.type && JSON.stringify(b.props) === JSON.stringify(payload.props)
        );
        if (found) {
          return {
            ...state,
            focusedId: found.id,
            buffers: state.buffers.map((b) => (b.id === found.id ? { ...b, visible: true } : b)),
          };
        }
      }

      const newBuffer: Buffer = {
        id: action.payload.id ?? generateId(),
        type: (payload.type as BufferType) ?? "editor",
        title: payload.title ?? String(payload.type ?? "buffer"),
        props: payload.props ?? {},
        pinned: !!payload.pinned,
        visible: true,
        createdAt: Date.now(),
      };
      return { ...state, buffers: [...state.buffers, newBuffer], focusedId: newBuffer.id };
    }
    case "CLOSE": {
      const buffers = state.buffers.filter((b) => b.id !== action.payload.id);
      const focusedId = state.focusedId === action.payload.id ? (buffers.length ? buffers[buffers.length - 1].id : null) : state.focusedId;
      return { ...state, buffers, focusedId };
    }
    case "FOCUS":
      return {
        ...state,
        focusedId: action.payload.id,
        buffers: state.buffers.map((b) => (b.id === action.payload.id ? { ...b, visible: true } : b)),
      };
    case "TOGGLE_VISIBILITY":
      return { ...state, buffers: state.buffers.map((b) => (b.id === action.payload.id ? { ...b, visible: !b.visible } : b)) };
    case "UPDATE_PROPS":
      return { ...state, buffers: state.buffers.map((b) => (b.id === action.payload.id ? { ...b, props: { ...b.props, ...action.payload.props } } : b)) };
    case "SET":
      return action.payload;
    default:
      return state;
  }
}

const BufferContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const BufferProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with saved state if available
  const loadInitialState = () => {
    try {
      const saved = localStorage.getItem("buffers:v1");
      if (saved) {
        const parsedState = JSON.parse(saved);
        // Validate the saved state has the correct shape
        if (parsedState && Array.isArray(parsedState.buffers)) {
          // Sanitize persisted buffers: don't auto-show tool panels at startup.
          const coreIds = new Set(["editor:main", "preview:main"]);
          const sanitized = (parsedState.buffers as Buffer[]).map((b) => {
            // If this is a tool-type buffer, default it to hidden on load
            const toolTypes = ['graph', 'templates', 'template', 'calculator', 'tools'];
            if (toolTypes.includes(String(b.type)) && !coreIds.has(b.id)) {
              return { ...b, visible: false };
            }
            return b;
          });

          return { ...parsedState, buffers: sanitized } as State;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved buffer state", e);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(reducer, loadInitialState());

  // Persist state on changes
  useEffect(() => {
    try {
      localStorage.setItem("buffers:v1", JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save buffer state", e);
    }
  }, [state]);

  return <BufferContext.Provider value={{ state, dispatch }}>{children}</BufferContext.Provider>;
};

export const useBufferContext = () => useContext(BufferContext);

export const useBuffers = () => {
  const { state, dispatch } = useBufferContext();
  return {
    buffers: state.buffers,
    focusedId: state.focusedId,
    open: (payload: Partial<Buffer> & { reuse?: boolean; id?: string }) => dispatch({ type: "OPEN", payload }),
    close: (id: string) => dispatch({ type: "CLOSE", payload: { id } }),
    focus: (id: string) => dispatch({ type: "FOCUS", payload: { id } }),
    toggle: (id: string) => dispatch({ type: "TOGGLE_VISIBILITY", payload: { id } }),
    updateProps: (id: string, props: Record<string, any>) => dispatch({ type: "UPDATE_PROPS", payload: { id, props } }),
  };
};

export default BufferProvider;
