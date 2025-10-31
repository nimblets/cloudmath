import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator as CalcIcon } from "lucide-react";
import { toast } from "sonner";

interface CalculatorProps {
  onInsertResult: (result: string) => void;
}

export const Calculator = ({ onInsertResult }: CalculatorProps) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  const evaluate = () => {
    try {
      // Basic evaluation - in production, use a proper math library like math.js
      // This is a simplified version for demonstration
      let processed = expression
        .replace(/\^/g, "**")
        .replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)")
        .replace(/sin\(([^)]+)\)/g, "Math.sin($1)")
        .replace(/cos\(([^)]+)\)/g, "Math.cos($1)")
        .replace(/tan\(([^)]+)\)/g, "Math.tan($1)")
        .replace(/log\(([^)]+)\)/g, "Math.log10($1)")
        .replace(/ln\(([^)]+)\)/g, "Math.log($1)");
      
      // eslint-disable-next-line no-eval
      const res = eval(processed);
      setResult(String(res));
      toast.success("Calculated!");
    } catch (error) {
      toast.error("Invalid expression");
      setResult("Error");
    }
  };

  const insert = () => {
    if (result && result !== "Error") {
      onInsertResult(result);
      toast.success("Result inserted!");
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CalcIcon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Quick Calculator</h3>
      </div>

      <div>
        <Label className="text-xs">Expression</Label>
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="2^3 + sqrt(16)"
          className="mt-1 font-mono"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              evaluate();
            }
          }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Supports: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), ln()
        </p>
      </div>

      {result && (
        <div className="p-2 bg-muted rounded">
          <Label className="text-xs">Result</Label>
          <div className="text-lg font-mono font-semibold">{result}</div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={evaluate} size="sm" className="flex-1">
          Calculate
        </Button>
        <Button onClick={insert} size="sm" variant="outline" disabled={!result || result === "Error"}>
          Insert
        </Button>
      </div>
    </Card>
  );
};
