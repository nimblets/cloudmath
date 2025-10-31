import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SymbolBarProps {
  onInsertSymbol: (symbol: string) => void;
}

const greekSymbols = [
  { label: "α", code: "\\alpha", key: "Alt+A" },
  { label: "β", code: "\\beta", key: "Alt+B" },
  { label: "γ", code: "\\gamma", key: "Alt+G" },
  { label: "δ", code: "\\delta", key: "Alt+D" },
  { label: "ε", code: "\\epsilon", key: "Alt+E" },
  { label: "θ", code: "\\theta", key: "Alt+T" },
  { label: "λ", code: "\\lambda", key: "Alt+L" },
  { label: "μ", code: "\\mu", key: "Alt+M" },
  { label: "π", code: "\\pi", key: "Alt+P" },
  { label: "σ", code: "\\sigma", key: "Alt+S" },
  { label: "φ", code: "\\phi", key: "Alt+F" },
  { label: "ω", code: "\\omega", key: "Alt+O" },
];

const operators = [
  { label: "∫", code: "\\int", key: "Ctrl+I" },
  { label: "∑", code: "\\sum", key: "Ctrl+S" },
  { label: "∏", code: "\\prod", key: "Ctrl+P" },
  { label: "√", code: "\\sqrt{}", key: "Ctrl+R" },
  { label: "∞", code: "\\infty", key: "Ctrl+8" },
  { label: "∂", code: "\\partial", key: "Ctrl+D" },
  { label: "∇", code: "\\nabla", key: "Ctrl+N" },
  { label: "d/dx", code: "\\frac{d}{dx}", key: "Ctrl+Shift+D" },
  { label: "lim", code: "\\lim_{}", key: "Ctrl+L" },
];

const relations = [
  { label: "≤", code: "\\leq", key: "Ctrl+<" },
  { label: "≥", code: "\\geq", key: "Ctrl+>" },
  { label: "≠", code: "\\neq", key: "Ctrl+=" },
  { label: "≈", code: "\\approx", key: "Ctrl+~" },
  { label: "∈", code: "\\in", key: "Ctrl+E" },
  { label: "∉", code: "\\notin", key: "Ctrl+Shift+E" },
  { label: "⊂", code: "\\subset", key: "Ctrl+[" },
  { label: "⊃", code: "\\supset", key: "Ctrl+]" },
  { label: "∀", code: "\\forall", key: "Ctrl+A" },
  { label: "∃", code: "\\exists", key: "Ctrl+Shift+E" },
  { label: "→", code: "\\rightarrow", key: "Ctrl+→" },
  { label: "⇒", code: "\\Rightarrow", key: "Ctrl+Shift+→" },
  { label: "±", code: "\\pm", key: "Ctrl+±" },
];

const functions = [
  { label: "sin", code: "\\sin", key: "" },
  { label: "cos", code: "\\cos", key: "" },
  { label: "tan", code: "\\tan", key: "" },
  { label: "log", code: "\\log", key: "" },
  { label: "ln", code: "\\ln", key: "" },
  { label: "exp", code: "\\exp", key: "" },
  { label: "det", code: "\\det", key: "" },
  { label: "max", code: "\\max", key: "" },
  { label: "min", code: "\\min", key: "" },
  { label: "sup", code: "\\sup", key: "" },
  { label: "inf", code: "\\inf", key: "" },
];

const setNotation = [
  { label: "∪", code: "\\cup", key: "" },
  { label: "∩", code: "\\cap", key: "" },
  { label: "∅", code: "\\emptyset", key: "" },
  { label: "ℕ", code: "\\mathbb{N}", key: "" },
  { label: "ℤ", code: "\\mathbb{Z}", key: "" },
  { label: "ℚ", code: "\\mathbb{Q}", key: "" },
  { label: "ℝ", code: "\\mathbb{R}", key: "" },
  { label: "ℂ", code: "\\mathbb{C}", key: "" },
];

const templates = [
  { label: "Fraction", code: "\\frac{}{}", key: "Ctrl+/" },
  { label: "Equation", code: "\n\\[\n  \n\\]\n", key: "Ctrl+Shift+E" },
  { label: "Align", code: "\n\\begin{align}\n  \n\\end{align}\n", key: "Ctrl+Shift+A" },
  { label: "Matrix", code: "\\begin{bmatrix}\n  \n\\end{bmatrix}", key: "Ctrl+Shift+M" },
  { label: "Cases", code: "\\begin{cases}\n  \n\\end{cases}", key: "Ctrl+Shift+C" },
  { label: "Set Builder", code: "\\{x \\mid \\}", key: "" },
  { label: "Subscript", code: "_{}", key: "Ctrl+_" },
  { label: "Superscript", code: "^{}", key: "Ctrl+^" },
];

const quickInserts = [
  { 
    label: "New Doc", 
    code: "\\documentclass{article}\n\\usepackage{amsmath}\n\\usepackage{amssymb}\n\n\\title{}\n\\author{}\n\\date{}\n\n\\begin{document}\n\\maketitle\n\n\\end{document}",
  },
  { label: "Title", code: "\\title{}" },
  { label: "Author", code: "\\author{}" },
  { label: "Date", code: "\\date{\\today}" },
  { label: "Section", code: "\\section{}" },
  { label: "Subsection", code: "\\subsection{}" },
  { 
    label: "Table", 
    code: "\\begin{table}[h]\n\\centering\n\\begin{tabular}{|c|c|c|}\n\\hline\n & & \\\\ \\hline\n & & \\\\ \\hline\n\\end{tabular}\n\\caption{}\n\\end{table}" 
  },
  { label: "Figure", code: "\\begin{figure}[h]\n\\centering\n% \\includegraphics{}\n\\caption{}\n\\end{figure}" },
  { label: "Item List", code: "\\begin{itemize}\n\\item \n\\end{itemize}" },
  { label: "Enum List", code: "\\begin{enumerate}\n\\item \n\\end{enumerate}" },
];

export const SymbolBar = ({ onInsertSymbol }: SymbolBarProps) => {
  return (
    <div className="h-20 border-t border-border bg-secondary/50">
      <Tabs defaultValue="quick" className="h-full">
        <div className="flex items-center border-b border-border px-2 h-8">
          <TabsList className="h-7 bg-transparent p-0">
            <TabsTrigger value="quick" className="h-6 px-2 text-xs">Quick Insert</TabsTrigger>
            <TabsTrigger value="operators" className="h-6 px-2 text-xs">Operators</TabsTrigger>
            <TabsTrigger value="greek" className="h-6 px-2 text-xs">Greek</TabsTrigger>
            <TabsTrigger value="relations" className="h-6 px-2 text-xs">Relations</TabsTrigger>
            <TabsTrigger value="functions" className="h-6 px-2 text-xs">Functions</TabsTrigger>
            <TabsTrigger value="sets" className="h-6 px-2 text-xs">Sets</TabsTrigger>
            <TabsTrigger value="templates" className="h-6 px-2 text-xs">Templates</TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="h-12">
          <TabsContent value="quick" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {quickInserts.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(item.code)}
                      className="h-7 px-2 text-xs hover:bg-accent/20"
                    >
                      {item.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs">
                    <div className="font-mono text-xs whitespace-pre-wrap">{item.code.slice(0, 100)}{item.code.length > 100 ? '...' : ''}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="operators" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {operators.map((sym) => (
                <Tooltip key={sym.code}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(sym.code)}
                      className="h-7 px-2 text-sm font-mono hover:bg-accent/20"
                    >
                      {sym.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="text-center">
                      <div className="font-mono">{sym.code}</div>
                      {sym.key && <div className="text-muted-foreground mt-1">{sym.key}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="greek" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {greekSymbols.map((sym) => (
                <Tooltip key={sym.code}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(sym.code)}
                      className="h-7 px-2 text-sm font-mono hover:bg-accent/20"
                    >
                      {sym.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="text-center">
                      <div className="font-mono">{sym.code}</div>
                      {sym.key && <div className="text-muted-foreground mt-1">{sym.key}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="relations" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {relations.map((sym) => (
                <Tooltip key={sym.code}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(sym.code)}
                      className="h-7 px-2 text-sm font-mono hover:bg-accent/20"
                    >
                      {sym.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="text-center">
                      <div className="font-mono">{sym.code}</div>
                      {sym.key && <div className="text-muted-foreground mt-1">{sym.key}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="functions" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {functions.map((sym) => (
                <Tooltip key={sym.code}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(sym.code)}
                      className="h-7 px-2 text-xs hover:bg-accent/20"
                    >
                      {sym.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-mono">{sym.code}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="sets" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {setNotation.map((sym) => (
                <Tooltip key={sym.code}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(sym.code)}
                      className="h-7 px-2 text-sm font-mono hover:bg-accent/20"
                    >
                      {sym.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-mono">{sym.code}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0 p-2">
            <div className="flex flex-wrap gap-1">
              {templates.map((tmpl) => (
                <Tooltip key={tmpl.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInsertSymbol(tmpl.code)}
                      className="h-7 px-2 text-xs hover:bg-accent/20"
                    >
                      {tmpl.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="text-center">
                      <div className="font-mono text-xs">{tmpl.code.replace(/\n/g, ' ')}</div>
                      {tmpl.key && <div className="text-muted-foreground mt-1">{tmpl.key}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
