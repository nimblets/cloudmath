import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Minimize2 } from "lucide-react";
import { CalculatorPane } from "./CalculatorPane";
import { useBuffers } from "../../state/BufferProvider";

interface DraggableCalculatorProps {
  onClose?: () => void;
  onInsertResult?: (result: string) => void;
  // bufferId is provided by BufferRenderer so the popup can close itself via buffer store
  bufferId?: string;
}

export const DraggableCalculator = ({ onClose, onInsertResult, bufferId }: DraggableCalculatorProps) => {
  const { close, focus } = useBuffers();

  // Focus this buffer when mounted so BufferProvider.focusedId reflects popup
  useEffect(() => {
    if (bufferId) focus(bufferId);
  }, [bufferId]);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  };

  const handlePopIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Request the app to convert popup -> tiled in a central place to avoid timing/race issues
    window.dispatchEvent(new CustomEvent("calculator:requestPopIn", { detail: { bufferId } }));
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) onClose();
    else if (bufferId) close(bufferId);
  };

  return (
    <Card
      ref={cardRef}
      className="fixed z-50 shadow-2xl w-80"
      style={{ left: `${position.x}px`, top: `${position.y}px`, cursor: isDragging ? "grabbing" : "default" }}
    >
      <div
        className="flex items-center justify-between p-3 border-b bg-secondary cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-semibold">Calculator</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePopIn} onMouseDown={(e) => e.stopPropagation()}>
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose} onMouseDown={(e) => e.stopPropagation()}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="h-[400px]">
        <CalculatorPane onInsertResult={onInsertResult} onClose={onClose ? onClose : (() => bufferId && close(bufferId))} hideHeader />
      </div>
    </Card>
  );
};
