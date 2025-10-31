import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface Template {
  name: string;
  description: string;
  code: string;
}

const builtInTemplates: Template[] = [
  {
    name: "Academic Paper",
    description: "Standard academic paper with sections",
    code: `\\documentclass[12pt]{article}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}

\\title{Your Title Here}
\\author{Your Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Your abstract here.
\\end{abstract}

\\section{Introduction}

\\section{Methods}

\\section{Results}

\\section{Discussion}

\\section{Conclusion}

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}`
  },
  {
    name: "Cheat Sheet",
    description: "Compact cheat sheet with colored boxes",
    code: `\\documentclass[landscape, 8pt]{extarticle}
\\usepackage{geometry}
\\usepackage[dvipsnames]{xcolor}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{multicol}
\\usepackage[framemethod=TikZ]{mdframed}

\\colorlet{colour1}{Red}
\\colorlet{colour2}{Green}
\\colorlet{colour3}{Cerulean}

\\geometry{
    a4paper, 
    margin=0.17in
}

\\begin{document}
\\begin{multicols}{3}

\\section*{Section 1}
\\begin{mdframed}[linecolor=colour1, linewidth=2pt]
Content here
\\end{mdframed}

\\section*{Section 2}
\\begin{mdframed}[linecolor=colour2, linewidth=2pt]
Content here
\\end{mdframed}

\\section*{Section 3}
\\begin{mdframed}[linecolor=colour3, linewidth=2pt]
Content here
\\end{mdframed}

\\end{multicols}
\\end{document}`
  },
  {
    name: "Homework Assignment",
    description: "Template for homework with problems",
    code: `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{enumitem}

\\title{Homework Assignment}
\\author{Your Name}
\\date{\\today}

\\begin{document}
\\maketitle

\\section*{Problem 1}
\\begin{enumerate}[label=(\\alph*)]
  \\item 
  \\item 
\\end{enumerate}

\\section*{Problem 2}

\\section*{Problem 3}

\\end{document}`
  },
  {
    name: "Beamer Presentation",
    description: "Basic presentation slides",
    code: `\\documentclass{beamer}
\\usetheme{Madrid}

\\title{Presentation Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\frame{\\titlepage}

\\begin{frame}
\\frametitle{Outline}
\\tableofcontents
\\end{frame}

\\section{Introduction}
\\begin{frame}
\\frametitle{Introduction}
Content here
\\end{frame}

\\section{Main Content}
\\begin{frame}
\\frametitle{Main Point}
Content here
\\end{frame}

\\section{Conclusion}
\\begin{frame}
\\frametitle{Conclusion}
Content here
\\end{frame}

\\end{document}`
  }
];

interface TemplateManagerProps {
  onInsertTemplate: (code: string) => void;
}

export const TemplateManager = ({ onInsertTemplate }: TemplateManagerProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleInsert = (template: Template) => {
    onInsertTemplate(template.code);
    toast.success(`${template.name} template inserted!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Document Templates</h3>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {builtInTemplates.map((template, idx) => (
            <Card key={idx} className="p-3 space-y-2">
              <div>
                <h4 className="font-semibold text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedTemplate(selectedTemplate?.name === template.name ? null : template)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  {selectedTemplate?.name === template.name ? "Hide" : "Preview"}
                </Button>
                <Button
                  onClick={() => handleInsert(template)}
                  size="sm"
                >
                  Use
                </Button>
              </div>
              
              {selectedTemplate?.name === template.name && (
                <div className="p-2 bg-muted rounded text-xs font-mono overflow-x-auto max-h-40">
                  <pre>{template.code}</pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
