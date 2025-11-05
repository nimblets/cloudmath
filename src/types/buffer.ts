// Core header action types
export type HeaderActionType = 
  | 'close'
  | 'toggle-direction' 
  | 'pop-out'
  | 'pop-in'
  | 'export-pdf'
  | 'maximize'
  | 'restore'
  | 'custom'
  | 'new-tab';

// Header section definition (left, center, right)
export interface HeaderSection {
  content?: React.ReactNode;
  actions?: HeaderAction[];
  className?: string;
  hidden?: boolean;
}

// Individual action definition
export interface HeaderAction {
  type: HeaderActionType;
  icon?: React.ReactNode;
  label?: string;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  order?: number; // Controls rendering order within section
  customElement?: React.ReactNode; // For special UI elements
}

// Tab configuration for buffers that support tabs
export interface BufferTab {
  id: string;
  title: string;
  active?: boolean;
  closeable?: boolean;
  icon?: React.ReactNode;
  onClose?: () => void;
  onClick?: () => void;
  onRename?: (newTitle: string) => void;
  editable?: boolean;
}

// Complete header configuration
export interface BufferHeaderProps {
  bufferId?: string;
  direction?: "horizontal" | "vertical";
  title?: string;
  
  // Sections
  left?: HeaderSection;
  center?: HeaderSection;
  right?: HeaderSection;
  
  // Tab support
  tabs?: BufferTab[];
  onNewTab?: () => void;
  
  // State
  maximized?: boolean;
  onMaximizeChange?: (maximized: boolean) => void;
  
  // Actions
  onHeaderAction?: (action: HeaderAction) => void;
  
  // Styles
  className?: string;
  style?: React.CSSProperties;
}

// Interface for components to implement header configuration
export interface WithBufferHeader {
  getHeaderProps: () => BufferHeaderProps;
  onHeaderAction?: (action: HeaderAction) => void;
}

// Header context for state sharing
export interface BufferHeaderContext {
  direction?: "horizontal" | "vertical";
  maximized?: boolean;
  setDirection?: (direction: "horizontal" | "vertical") => void;
  setMaximized?: (maximized: boolean) => void;
}