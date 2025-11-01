import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Point {
  x: number;
  y: number;
  label?: string;
}

interface GraphBuilderProps {
  onInsertCode: (code: string) => void;
}

// --- DesmosPreview Component ---
declare global {
  interface Window {
    Desmos: any;
  }
}

const DesmosPreview = ({ expression }: { expression: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);

  useEffect(() => {
    if (!window.Desmos) {
      const script = document.createElement("script");
      script.src = "https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      script.async = true;
      script.onload = initCalculator;
      document.body.appendChild(script);
    } else {
      initCalculator();
    }

    function initCalculator() {
      if (containerRef.current && !calculatorRef.current) {
        calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          expressions: false,
          settingsMenu: false,
          zoomButtons: false,
          expressionsTopbar: false,
          lockViewport: false,
          showResetButtonOnGraphpaper: false,
          keypad: false,
        });

        calculatorRef.current.setMathBounds({
          left: -5,
          right: 5,
          bottom: -5,
          top: 5,
        });
      }
    }

    return () => {
      calculatorRef.current?.destroy?.();
      calculatorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (calculatorRef.current) {
      calculatorRef.current.setExpression({ id: "func", latex: expression });
    }
  }, [expression]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "400px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    />
  );
};

// --- Main GraphBuilder Component ---
export const GraphBuilder = ({ onInsertCode }: GraphBuilderProps) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [graphType, setGraphType] = useState<"scatter" | "line" | "function">("line");
  const [functionExpr, setFunctionExpr] = useState("x^2");
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [yMin, setYMin] = useState(-5);
  const [yMax] = useState(5);

  const addPoint = () => setPoints([...points, { x: 0, y: 0 }]);
  const removePoint = (index: number) => setPoints(points.filter((_, i) => i !== index));
  const updatePoint = (index: number, field: keyof Point, value: number | string) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setPoints(newPoints);
  };

  const generateTikZCode = () => {
    let code = `\\begin{tikzpicture}
\\begin{axis}[
  axis lines = center,
  xlabel = $x$,
  ylabel = $y$,
  xmin=${xMin}, xmax=${xMax},
  ymin=${yMin}, ymax=${yMax},
  grid = major
]

`;

    if (graphType === "function") {
      code += `\\addplot[
  domain=${xMin}:${xMax},
  samples=100,
  color=blue,
  thick
]{${functionExpr}};

`;
    } else if (graphType === "line" && points.length > 0) {
      code += `\\addplot[
  color=blue,
  mark=*,
  thick
] coordinates {
`;
      points.forEach((p) => {
        code += `  (${p.x},${p.y})${p.label ? ` node[above]{$${p.label}$}` : ""}\n`;
      });
      code += `};

`;
    } else if (graphType === "scatter" && points.length > 0) {
      code += `\\addplot[
  only marks,
  mark=*,
  color=blue
] coordinates {
`;
      points.forEach((p) => {
        code += `  (${p.x},${p.y})\n`;
      });
      code += `};

`;
    }

    code += `\\end{axis}
\\end{tikzpicture}`;

    return code;
  };

  const handleInsert = () => {
    const code = generateTikZCode();
    onInsertCode("\n" + code + "\n");
    toast.success("TikZ graph inserted!");
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">TikZ Graph Builder</h3>
        <Button onClick={handleInsert} size="sm">
          Insert Graph
        </Button>
      </div>

      <Tabs value={graphType} onValueChange={(v) => setGraphType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="line">Line</TabsTrigger>
          <TabsTrigger value="scatter">Scatter</TabsTrigger>
          <TabsTrigger value="function">Function</TabsTrigger>
        </TabsList>

        {/* --- Function Tab --- */}
        <TabsContent value="function" className="space-y-3">
          <div>
            <Label className="text-xs">Function (e.g., x^2, sin(x))</Label>
            <Input
              value={functionExpr}
              onChange={(e) => setFunctionExpr(e.target.value)}
              placeholder="x^2"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs mb-2 block">Graph Preview</Label>
            <DesmosPreview expression={functionExpr} />
            <p className="text-xs text-muted-foreground mt-1">
              Graph updates automatically as you edit the function.
            </p>
          </div>
        </TabsContent>

        {/* --- Line Tab --- */}
        <TabsContent value="line" className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Points</Label>
            <Button onClick={addPoint} size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" /> Add Point
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {points.map((point, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={point.x}
                  onChange={(e) => updatePoint(idx, "x", parseFloat(e.target.value))}
                  placeholder="x"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={point.y}
                  onChange={(e) => updatePoint(idx, "y", parseFloat(e.target.value))}
                  placeholder="y"
                  className="w-20"
                />
                <Input
                  value={point.label || ""}
                  onChange={(e) => updatePoint(idx, "label", e.target.value)}
                  placeholder="Label"
                  className="flex-1"
                />
                <Button onClick={() => removePoint(idx)} size="icon" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* --- Scatter Tab --- */}
        <TabsContent value="scatter" className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Points</Label>
            <Button onClick={addPoint} size="sm" variant="outline">
              <Plus className="h-3 w-3 mr-1" /> Add Point
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {points.map((point, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={point.x}
                  onChange={(e) => updatePoint(idx, "x", parseFloat(e.target.value))}
                  placeholder="x"
                  className="w-24"
                />
                <Input
                  type="number"
                  value={point.y}
                  onChange={(e) => updatePoint(idx, "y", parseFloat(e.target.value))}
                  placeholder="y"
                  className="w-24"
                />
                <Button onClick={() => removePoint(idx)} size="icon" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">X Min</Label>
          <Input
            type="number"
            value={xMin}
            onChange={(e) => setXMin(parseFloat(e.target.value))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">X Max</Label>
          <Input
            type="number"
            value={xMax}
            onChange={(e) => setXMax(parseFloat(e.target.value))}
            className="mt-1"
          />
        </div>
      </div>

      <div className="p-2 bg-muted rounded text-xs font-mono overflow-x-auto max-h-32">
        <pre>{generateTikZCode()}</pre>
      </div>
    </Card>
  );
};
