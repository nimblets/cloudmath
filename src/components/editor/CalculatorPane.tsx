import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { toast } from "sonner";

interface CalculatorPaneProps {
  onInsertResult: (result: string) => void;
  onClose: () => void;
}

export const CalculatorPane = ({ onInsertResult, onClose }: CalculatorPaneProps) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<Array<{ expr: string; result: string }>>([]);

  const evaluate = () => {
    try {
      let processed = expression
        .replace(/\^/g, "**")
        .replace(/√/g, "Math.sqrt")
        .replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)")
        .replace(/sin\(([^)]+)\)/g, "Math.sin($1)")
        .replace(/cos\(([^)]+)\)/g, "Math.cos($1)")
        .replace(/tan\(([^)]+)\)/g, "Math.tan($1)")
        .replace(/asin\(([^)]+)\)/g, "Math.asin($1)")
        .replace(/acos\(([^)]+)\)/g, "Math.acos($1)")
        .replace(/atan\(([^)]+)\)/g, "Math.atan($1)")
        .replace(/log\(([^)]+)\)/g, "Math.log10($1)")
        .replace(/ln\(([^)]+)\)/g, "Math.log($1)")
        .replace(/abs\(([^)]+)\)/g, "Math.abs($1)")
        .replace(/floor\(([^)]+)\)/g, "Math.floor($1)")
        .replace(/ceil\(([^)]+)\)/g, "Math.ceil($1)")
        .replace(/round\(([^)]+)\)/g, "Math.round($1)")
        .replace(/π/g, "Math.PI")
        .replace(/pi/g, "Math.PI")
        .replace(/e(?![a-z])/g, "Math.E");
      
      // eslint-disable-next-line no-eval
      const res = eval(processed);
      const formatted = typeof res === 'number' ? res.toFixed(8).replace(/\.?0+$/, '') : String(res);
      setResult(formatted);
      setHistory(prev => [...prev, { expr: expression, result: formatted }].slice(-10));
      toast.success("Calculated!");
    } catch (error) {
      toast.error("Invalid expression");
      setResult("Error");
    }
  };

  const insert = () => {
    if (result && result !== "Error") {
      onInsertResult(result);
      toast.success("Inserted into document!");
    }
  };

  const addToExpression = (value: string) => {
    setExpression(prev => prev + value);
  };

  const scientificButtons = [
    { label: "π", value: "pi" },
    { label: "e", value: "e" },
    { label: "√", value: "sqrt(" },
    { label: "^", value: "^" },
    { label: "d/dx", value: "derivative(" },
    { label: "sin", value: "sin(" },
    { label: "cos", value: "cos(" },
    { label: "tan", value: "tan(" },
    { label: "asin", value: "asin(" },
    { label: "acos", value: "acos(" },
    { label: "atan", value: "atan(" },
    { label: "log", value: "log(" },
    { label: "ln", value: "ln(" },
    { label: "abs", value: "abs(" },
    { label: "(", value: "(" },
    { label: ")", value: ")" },
  ];

  const numberButtons = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+",
  ];

  return (
    <Card className="h-full flex flex-col bg-card">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Scientific Calculator</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Expression</Label>
            <Input
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Enter calculation..."
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  evaluate();
                } else if (e.ctrlKey && e.key === "d") {
                  e.preventDefault();
                  addToExpression("derivative(");
                }
              }}
            />
          </div>

          {result && (
            <div className="p-3 bg-accent/20 rounded border border-accent/30">
              <Label className="text-xs mb-1 block">Result</Label>
              <div className="text-xl font-mono font-bold text-accent-foreground">{result}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Scientific Functions</Label>
            <div className="grid grid-cols-3 gap-1">
              {scientificButtons.map((btn) => (
                <Button
                  key={btn.label}
                  onClick={() => addToExpression(btn.value)}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-mono"
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Number Pad</Label>
            <div className="grid grid-cols-4 gap-1">
              {numberButtons.map((btn) => (
                <Button
                  key={btn}
                  onClick={() => {
                    if (btn === "=") {
                      evaluate();
                    } else {
                      addToExpression(btn);
                    }
                  }}
                  size="sm"
                  variant={btn === "=" ? "default" : "outline"}
                  className="h-10 text-sm font-mono"
                >
                  {btn}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={evaluate} className="flex-1" size="sm">
              Calculate
            </Button>
            <Button 
              onClick={insert} 
              size="sm" 
              variant="secondary"
              disabled={!result || result === "Error"}
            >
              Insert
            </Button>
            <Button 
              onClick={() => { setExpression(""); setResult(""); }} 
              size="sm" 
              variant="ghost"
            >
              Clear
            </Button>
          </div>

          {history.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">History</Label>
              <div className="space-y-1">
                {history.slice().reverse().map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 bg-muted rounded text-xs font-mono cursor-pointer hover:bg-muted/70"
                    onClick={() => setExpression(item.expr)}
                  >
                    <div className="text-muted-foreground">{item.expr}</div>
                    <div className="font-semibold">= {item.result}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
