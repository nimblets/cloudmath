import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export const GraphBuilder = ({ onInsertCode }: GraphBuilderProps) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [graphType, setGraphType] = useState<"scatter" | "line" | "function">("line");
  const [functionExpr, setFunctionExpr] = useState("x^2");
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [yMin, setYMin] = useState(-5);
  const [yMax] = useState(5);

  const addPoint = () => {
    setPoints([...points, { x: 0, y: 0 }]);
  };

  const removePoint = (index: number) => {
    setPoints(points.filter((_, i) => i !== index));
  };

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
        code += `  (${p.x},${p.y})${p.label ? ` node[above]{$${p.label}$}` : ''}\n`;
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
    onInsertCode('\n' + code + '\n');
    toast.success("TikZ graph inserted!");
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">TikZ Graph Builder</h3>
        <Button onClick={handleInsert} size="sm">Insert Graph</Button>
      </div>

      <Tabs value={graphType} onValueChange={(v) => setGraphType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="line">Line</TabsTrigger>
          <TabsTrigger value="scatter">Scatter</TabsTrigger>
          <TabsTrigger value="function">Function</TabsTrigger>
        </TabsList>

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
            <Label className="text-xs mb-2 block">Desmos Preview</Label>
            <iframe
              src={`https://www.desmos.com/calculator`}
              className="w-full h-64 border border-border rounded"
              title="Desmos Calculator"
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                try {
                  // Desmos API would need to be initialized here
                  // For now, just show the calculator interface
                } catch (error) {
                  console.error('Desmos iframe error:', error);
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Type your function in the Desmos calculator above to preview
            </p>
          </div>
        </TabsContent>

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
                  onChange={(e) => updatePoint(idx, 'x', parseFloat(e.target.value))}
                  placeholder="x"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={point.y}
                  onChange={(e) => updatePoint(idx, 'y', parseFloat(e.target.value))}
                  placeholder="y"
                  className="w-20"
                />
                <Input
                  value={point.label || ''}
                  onChange={(e) => updatePoint(idx, 'label', e.target.value)}
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
                  onChange={(e) => updatePoint(idx, 'x', parseFloat(e.target.value))}
                  placeholder="x"
                  className="w-24"
                />
                <Input
                  type="number"
                  value={point.y}
                  onChange={(e) => updatePoint(idx, 'y', parseFloat(e.target.value))}
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
