import { Moon, Sun, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToolsPanel } from "../tools/ToolsPanel";

interface HeaderProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  borderRadius: number;
  onBorderRadiusChange: (value: number) => void;
  onInsertCode?: (code: string) => void;
}

export const Header = ({ theme, onThemeToggle, borderRadius, onBorderRadiusChange, onInsertCode }: HeaderProps) => {
  return (
    <header className="h-10 border-b border-border bg-card flex items-center justify-between px-3">
      <h1 className="text-sm font-mono font-semibold text-foreground">LaTeX Editor</h1>
      
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
