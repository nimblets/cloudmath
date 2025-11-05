import React from 'react';
import type { BufferHeaderProps } from '@/types/buffer';
import { FileText } from 'lucide-react';

interface PreviewHeaderFactory {
  content: string;
  direction: "horizontal" | "vertical";
  bufferId?: string;
  onExportPDF: () => void;
}

export const createPreviewHeader = ({
  content,
  direction,
  bufferId,
  onExportPDF
}: PreviewHeaderFactory): BufferHeaderProps => {
  return {
    title: "Preview",
    bufferId,
    direction,
    right: {
      actions: [
        {
          type: 'export-pdf',
          icon: <FileText className="h-4 w-4" />,
          label: "Export PDF",
          onClick: onExportPDF,
          order: 96
        },
        {
          type: 'toggle-direction',
          title: direction,
          order: 97
        }
      ]
    }
  };
};