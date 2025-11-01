import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";


interface Symbol {
  label: string;
  code: string;
  key?: string;
  category: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (code: string) => void;
}

export const allSymbols: Symbol[] = [
  // Greek
  { label: "α (alpha)", code: "\\alpha", key: "Alt+A", category: "Greek" },
  { label: "β (beta)", code: "\\beta", key: "Alt+B", category: "Greek" },
  { label: "γ (gamma)", code: "\\gamma", key: "Alt+G", category: "Greek" },
  { label: "δ (delta)", code: "\\delta", key: "Alt+D", category: "Greek" },
  { label: "ε (epsilon)", code: "\\epsilon", key: "Alt+E", category: "Greek" },
  { label: "θ (theta)", code: "\\theta", key: "Alt+T", category: "Greek" },
  { label: "λ (lambda)", code: "\\lambda", key: "Alt+L", category: "Greek" },
  { label: "μ (mu)", code: "\\mu", key: "Alt+M", category: "Greek" },
  { label: "π (pi)", code: "\\pi", key: "Alt+P", category: "Greek" },
  { label: "σ (sigma)", code: "\\sigma", key: "Alt+S", category: "Greek" },
  { label: "φ (phi)", code: "\\phi", key: "Alt+F", category: "Greek" },
  { label: "ω (omega)", code: "\\omega", key: "Alt+O", category: "Greek" },
  
  // Operators
  { label: "∫ Integral", code: "\\int", key: "Ctrl+I", category: "Operators" },
  { label: "∑ Sum", code: "\\sum", key: "Ctrl+S", category: "Operators" },
  { label: "∏ Product", code: "\\prod", key: "Ctrl+P", category: "Operators" },
  { label: "√ Square root", code: "\\sqrt{}", key: "Ctrl+R", category: "Operators" },
  { label: "∞ Infinity", code: "\\infty", key: "Ctrl+8", category: "Operators" },
  { label: "∂ Partial", code: "\\partial", key: "Ctrl+D", category: "Operators" },
  { label: "∇ Nabla", code: "\\nabla", key: "Ctrl+N", category: "Operators" },
  { label: "d/dx Derivative", code: "\\frac{d}{dx}", key: "Ctrl+Shift+D", category: "Operators" },
  { label: "lim Limit", code: "\\lim_{}", key: "Ctrl+L", category: "Operators" },
  
  // Relations
  { label: "≤ Less or equal", code: "\\leq", category: "Relations" },
  { label: "≥ Greater or equal", code: "\\geq", category: "Relations" },
  { label: "≠ Not equal", code: "\\neq", category: "Relations" },
  { label: "≈ Approximately", code: "\\approx", category: "Relations" },
  { label: "∈ Element of", code: "\\in", key: "Ctrl+E", category: "Relations" },
  { label: "∉ Not element", code: "\\notin", category: "Relations" },
  { label: "⊂ Subset", code: "\\subset", category: "Relations" },
  { label: "⊃ Superset", code: "\\supset", category: "Relations" },
  { label: "∀ For all", code: "\\forall", key: "Ctrl+A", category: "Relations" },
  { label: "∃ Exists", code: "\\exists", category: "Relations" },
  { label: "→ Right arrow", code: "\\rightarrow", category: "Relations" },
  { label: "⇒ Right double arrow", code: "\\Rightarrow", category: "Relations" },
  { label: "± Plus minus", code: "\\pm", category: "Relations" },
  
  // Templates
  { label: "Fraction", code: "\\frac{}{}", key: "Ctrl+/", category: "Templates" },
  { label: "Equation", code: "\n\\[\n  \n\\]\n", key: "Ctrl+Shift+E", category: "Templates" },
  { label: "Align", code: "\n\\begin{align}\n  \n\\end{align}\n", key: "Ctrl+Shift+A", category: "Templates" },
  { label: "Matrix", code: "\\begin{bmatrix}\n  \n\\end{bmatrix}", key: "Ctrl+Shift+M", category: "Templates" },
  { label: "Cases", code: "\\begin{cases}\n  \n\\end{cases}", key: "Ctrl+Shift+C", category: "Templates" },
  { label: "Subscript", code: "_{}", key: "Ctrl+_", category: "Templates" },
  { label: "Superscript", code: "^{}", key: "Ctrl+^", category: "Templates" },
  
  // Sets
  { label: "∪ Union", code: "\\cup", category: "Sets" },
  { label: "∩ Intersection", code: "\\cap", category: "Sets" },
  { label: "∅ Empty set", code: "\\emptyset", category: "Sets" },
  { label: "ℕ Natural numbers", code: "\\mathbb{N}", category: "Sets" },
  { label: "ℤ Integers", code: "\\mathbb{Z}", category: "Sets" },
  { label: "ℚ Rationals", code: "\\mathbb{Q}", category: "Sets" },
  { label: "ℝ Real numbers", code: "\\mathbb{R}", category: "Sets" },
  { label: "ℂ Complex numbers", code: "\\mathbb{C}", category: "Sets" },
];

export const CommandPalette = ({ open, onOpenChange, onSelect }: CommandPaletteProps) => {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const categories = Array.from(new Set(allSymbols.map(s => s.category)));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search symbols and templates..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No symbols found.</CommandEmpty>
        {categories.map((category) => {
          const symbols = allSymbols.filter(s => s.category === category);
          return (
            <CommandGroup key={category} heading={category}>
              {symbols.map((symbol) => (
                <CommandItem
                  key={symbol.code}
                  onSelect={() => {
                    onSelect(symbol.code);
                    onOpenChange(false);
                  }}
                >
                  <span className="flex-1">{symbol.label}</span>
                  {symbol.key && (
                    <span className="text-xs text-muted-foreground ml-2 font-mono">
                      {symbol.key}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
};