import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Document } from "../LaTeXEditor";

interface TabBarProps {
  documents: Document[];
  activeDocId: string;
  onDocumentChange: (id: string) => void;
  onNewDocument: () => void;
  onRenameDocument: (id: string, newTitle: string) => void;
  onCloseDocument: (id: string) => void;
}

export const TabBar = ({
  documents,
  activeDocId,
  onDocumentChange,
  onNewDocument,
  onCloseDocument,
}: TabBarProps) => {
  return (
    <div className="flex items-center bg-secondary border-b border-border h-10 overflow-x-auto">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`flex items-center gap-1 px-3 h-full border-r border-border cursor-pointer group ${
            doc.id === activeDocId ? "bg-card" : "hover:bg-card/50"
          }`}
          onClick={() => onDocumentChange(doc.id)}
        >
          <span className="text-xs font-mono truncate max-w-[120px]">
            {doc.title}
          </span>
          {documents.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseDocument(doc.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 hover:text-destructive" />
            </button>
          )}
        </div>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onNewDocument}
        className="h-8 ml-1"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};
