import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, X, Plus, ArrowDownToLine, ArrowUpLeftSquare, FileText } from 'lucide-react';
import type { BufferHeaderProps, HeaderSection, HeaderAction, BufferTab } from '@/types/buffer';

// Helper to render section content
const HeaderSectionContent = ({ section }: { section?: HeaderSection }) => {
  if (!section || section.hidden) return null;

  return (
    <div className={cn('flex items-center gap-1', section.className)}>
      {section.content}
      {section.actions?.sort((a, b) => (a.order || 0) - (b.order || 0)).map((action, i) => (
        <HeaderAction key={i} action={action} />
      ))}
    </div>
  );
};

// Individual action button
const HeaderAction = ({ action }: { action: HeaderAction }) => {
  if (action.hidden) return null;
  if (action.customElement) return <>{action.customElement}</>;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2"
      title={action.title}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon || {
        close: <X className="h-4 w-4" />,
        'toggle-direction': <span className="text-xs">{action.title === 'horizontal' ? '⇅' : '⇄'}</span>,
        'pop-out': <ArrowUpLeftSquare className="h-4 w-4" />,
        'pop-in': <ArrowDownToLine className="h-4 w-4" />,
        'export-pdf': <FileText className="h-4 w-4" />,
        'maximize': <Maximize2 className="h-4 w-4" />,
        'restore': <Minimize2 className="h-4 w-4" />,
      }[action.type]}
      {action.label && <span className="ml-2">{action.label}</span>}
    </Button>
  );
};

// Tab rendering component
const TabBar = ({ 
  tabs, 
  onNewTab,
  onHeaderAction 
}: { 
  tabs?: BufferTab[], 
  onNewTab?: () => void,
  onHeaderAction?: (action: HeaderAction) => void
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when editing starts
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      // Select all except the .tex extension
      const dotIndex = editValue.lastIndexOf('.');
      if (dotIndex > 0) {
        editInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        editInputRef.current.select();
      }
    }
  }, [editingTabId]);

  if (!tabs?.length) return null;

  const handleDoubleClick = (tab: BufferTab) => {
    if (!tab.editable) return;
    setEditingTabId(tab.id);
    setEditValue(tab.title);
  };

  const handleEditComplete = (tab: BufferTab) => {
    if (!editValue.trim()) return;
    
    // Ensure .tex extension
    let newTitle = editValue.trim();
    if (!newTitle.endsWith('.tex')) {
      newTitle += '.tex';
    }
    
    tab.onRename?.(newTitle);
    setEditingTabId(null);
  };

  return (
    <div className="flex items-center overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            'flex items-center gap-1 px-3 h-full border-r border-border cursor-pointer group',
            tab.active ? 'bg-card' : 'hover:bg-card/50'
          )}
          onClick={tab.onClick}
          onDoubleClick={() => handleDoubleClick(tab)}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          {editingTabId === tab.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditComplete(tab);
                } else if (e.key === 'Escape') {
                  setEditingTabId(null);
                }
                e.stopPropagation();
              }}
              onBlur={() => handleEditComplete(tab)}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-mono bg-transparent border-none outline-none focus:ring-1 focus:ring-accent px-0 py-0 w-[120px]"
            />
          ) : (
            <span className="text-xs font-mono truncate max-w-[120px]">{tab.title}</span>
          )}
          {tab.closeable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                tab.onClose?.();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 hover:text-destructive" />
            </button>
          )}
        </div>
      ))}
      {onNewTab && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            onHeaderAction?.({ type: 'new-tab' });
            onNewTab();
          }} 
          className="h-8 ml-1"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export const BufferHeader: React.FC<BufferHeaderProps> = ({
  bufferId,
  title,
  left,
  center,
  right,
  tabs,
  onNewTab,
  direction,
  maximized,
  onMaximizeChange,
  onHeaderAction,
  className,
  style
}) => {
  // Build default right section if none provided
  const defaultRight: HeaderSection = {
    actions: [
      {
        type: 'toggle-direction',
        title: direction,
        onClick: () => {
          // Dispatch direction toggle event
          window.dispatchEvent(new CustomEvent('buffer:toggleDirection', { 
            detail: { bufferId, direction } 
          }));
        },
        order: 97
      },
      maximized !== undefined && {
        type: maximized ? 'restore' : 'maximize',
        icon: maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />,
        onClick: () => onMaximizeChange?.(!maximized),
        order: 98
      },
      {
        type: 'close',
        icon: <X className="h-4 w-4" />,
        onClick: () => {
          // Dispatch close event that BufferLayout can handle
          window.dispatchEvent(new CustomEvent('buffer:close', { detail: { bufferId } }));
        },
        order: 99
      }
    ].filter(Boolean) as HeaderAction[]
  };

  return (
    <div
      className={cn(
        'flex items-center bg-secondary border-b border-border h-10 mx-0 my-0 py-[24px] px-2',
        className
      )}
      style={style}
    >
      {/* Left section - typically tabs or title */}
      <div className="flex-1 flex items-center">
        {tabs ? (
          <TabBar 
            tabs={tabs} 
            onNewTab={onNewTab} 
            onHeaderAction={onHeaderAction} 
          />
        ) : (
          <HeaderSectionContent 
            section={{
              ...left,
              content: left?.content || (title && <span className="text-sm font-semibold">{title}</span>)
            }} 
          />
        )}
      </div>

      {/* Center section - optional */}
      {center && <HeaderSectionContent section={center} />}

      {/* Right section - actions with click handling */}
      <HeaderSectionContent 
        section={{
          ...right,
          actions: (right?.actions || defaultRight.actions || []).map(action => ({
            ...action,
            onClick: () => {
              // Call both the action's onClick and the header's onHeaderAction
              action.onClick?.();
              onHeaderAction?.(action);
            }
          }))
        }}
      />
    </div>
  );
};

export default BufferHeader;