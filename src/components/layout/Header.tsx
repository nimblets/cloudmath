import { Moon, Sun, Settings2, Wrench, Box, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBuffers } from "@/state/BufferProvider";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToolsPanel } from "../tools/ToolsPanel";

interface HeaderProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  borderRadius: number;
  onBorderRadiusChange: (value: number) => void;
  onInsertCode?: (code: string) => void;
  onNewWindow?: () => void;
  onImportText?: () => void;
  onExportPDF?: () => void;
}

export const Header = ({ theme, onThemeToggle, borderRadius, onBorderRadiusChange, onInsertCode, onNewWindow, onImportText, onExportPDF }: HeaderProps) => {
  const { open } = useBuffers();

  const openTool = (tool: string, mode: "panel" | "popup" = "panel") => {
    const id = `tool:${tool}:${mode}`;
    open({
      id,
      type: tool,
      props: { mode, onInsertCode },
      reuse: true,
      visible: true,
    });
  };

  return (
    <header className="h-8 border-b border-border bg-card flex items-center justify-between px-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono font-bold text-orange-500 lowercase">cloudmath</span>
        <nav className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">File</Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-[160px] max-h-64 overflow-auto">
              <div className="flex flex-col">
                <Button variant="ghost" size="sm" className="justify-start px-2 py-1 text-sm" onClick={() => onImportText?.()}>Import text</Button>
                <Button variant="ghost" size="sm" className="justify-start px-2 py-1 text-sm" onClick={() => onExportPDF?.()}>Export PDF</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Edit</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Selection</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">View</Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Tools">
                Tools
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-[160px] max-h-64 overflow-auto">
              <div className="flex flex-col">
                <Button variant="ghost" size="sm" className="justify-start px-2 py-1 text-sm truncate" onClick={() => openTool('graph','panel')}>Graph Builder</Button>
                <Button variant="ghost" size="sm" className="justify-start px-2 py-1 text-sm truncate" onClick={() => openTool('calculator','panel')}>Calculator</Button>
                <Button variant="ghost" size="sm" className="justify-start px-2 py-1 text-sm truncate" onClick={() => openTool('templates','panel')}>Templates</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Window actions">
                Window
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44">
              <div className="flex flex-col">
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => onNewWindow?.()}>New workspace</Button>
              </div>
            </PopoverContent>
          </Popover>
        </nav>
      </div>

      <div className="flex items-center gap-1">
        {onInsertCode && <ToolsPanel onInsertCode={onInsertCode} />}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="UI Settings">
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Border Radius: {borderRadius}px</Label>
                <Slider
                  value={[borderRadius]}
                  onValueChange={([value]) => onBorderRadiusChange(value)}
                  min={0}
                  max={16}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onThemeToggle}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};
