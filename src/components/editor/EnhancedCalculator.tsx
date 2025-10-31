import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EnhancedCalculatorProps {
  onInsertResult: (result: string) => void;
}

export const EnhancedCalculator = ({ onInsertResult }: EnhancedCalculatorProps) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

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
        .replace(/e/g, "Math.E");
      
      // eslint-disable-next-line no-eval
      const res = eval(processed);
      const formatted = typeof res === 'number' ? res.toFixed(6).replace(/\.?0+$/, '') : String(res);
      setResult(formatted);
      toast.success("Calculated!");
    } catch (error) {
      toast.error("Invalid expression");
      setResult("Error");
    }
  };

  const insert = () => {
    if (result && result !== "Error") {
      onInsertResult(result);
      toast.success("Inserted!");
    }
  };

  const addToExpression = (value: string) => {
    setExpression(prev => prev + value);
  };

  const quickButtons = [
    { label: "π", value: "pi" },
    { label: "e", value: "e" },
    { label: "√", value: "sqrt(" },
    { label: "sin", value: "sin(" },
    { label: "cos", value: "cos(" },
    { label: "tan", value: "tan(" },
    { label: "log", value: "log(" },
    { label: "ln", value: "ln(" },
  ];

  return (
    <div className="space-y-2 p-2 bg-secondary/30 rounded">
      <Label className="text-xs font-semibold">Calculator</Label>
      <Input
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        placeholder="2^3 + sqrt(16)"
        className="h-7 text-xs font-mono"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            evaluate();
          }
        }}
      />
      
      <div className="flex flex-wrap gap-1">
        {quickButtons.map((btn) => (
          <Button
            key={btn.label}
            onClick={() => addToExpression(btn.value)}
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {result && (
        <div className="p-2 bg-accent/10 rounded border border-accent/20">
          <div className="text-sm font-mono font-semibold text-accent-foreground">{result}</div>
        </div>
      )}

      <div className="flex gap-1">
        <Button onClick={evaluate} size="sm" className="flex-1 h-7 text-xs">
          Calculate
        </Button>
        <Button 
          onClick={insert} 
          size="sm" 
          variant="outline" 
          disabled={!result || result === "Error"}
          className="h-7 text-xs"
        >
          Insert
        </Button>
        <Button 
          onClick={() => { setExpression(""); setResult(""); }} 
          size="sm" 
          variant="ghost"
          className="h-7 text-xs"
        >
          Clear
        </Button>
      </div>
    </div>
  );
};
