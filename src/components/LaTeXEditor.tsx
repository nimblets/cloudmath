import { useState } from "react";
import { EditorPane } from "./editor/EditorPane";
import { PreviewPane } from "./preview/PreviewPane";
import { Header } from "./layout/Header";

export interface Document {
  id: string;
  title: string;
  content: string;
}

export const LaTeXEditor = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      title: "untitled.tex",
      content: `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{My Document}
\\author{}
\\date{}

\\begin{document}

\\maketitle

\\section{Introduction}

This is a sample LaTeX document. Write your math equations here:

\\[
  f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
\\]

\\subsection{More Math}

Inline math: $E = mc^2$ and display math:

\\begin{align}
  a^2 + b^2 &= c^2 \\\\
  \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t}
\\end{align}

\\end{document}`,
    },
  ]);

  const [activeDocId, setActiveDocId] = useState<string>("1");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [borderRadius, setBorderRadius] = useState<number>(4);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  const updateDocContent = (id: string, content: string) => {
    setDocuments((docs) =>
      docs.map((doc) => (doc.id === id ? { ...doc, content } : doc))
    );
  };

  const addNewDocument = () => {
    const newId = String(Date.now());
    const newDoc: Document = {
      id: newId,
      title: `untitled-${documents.length + 1}.tex`,
      content: `\\documentclass{article}

\\begin{document}

% Start writing here

\\end{document}`,
    };
    setDocuments([...documents, newDoc]);
    setActiveDocId(newId);
  };

  const renameDocument = (id: string, newTitle: string) => {
    setDocuments((docs) =>
      docs.map((doc) => (doc.id === id ? { ...doc, title: newTitle } : doc))
    );
  };

  const closeDocument = (id: string) => {
    if (documents.length === 1) return; // Keep at least one document
    
    const newDocs = documents.filter((d) => d.id !== id);
    setDocuments(newDocs);
    
    if (activeDocId === id) {
      setActiveDocId(newDocs[0].id);
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark" : ""}`} style={{ "--radius": `${borderRadius}px` } as React.CSSProperties}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header 
          theme={theme} 
          onThemeToggle={() => setTheme(theme === "light" ? "dark" : "light")}
          borderRadius={borderRadius}
          onBorderRadiusChange={setBorderRadius}
          onInsertCode={(code) => updateDocContent(activeDocId, activeDoc.content + "\n" + code)}
        />
        
        <EditorPane
          documents={documents}
          activeDocId={activeDocId}
          onDocumentChange={setActiveDocId}
          onContentChange={updateDocContent}
          onNewDocument={addNewDocument}
          onRenameDocument={renameDocument}
          onCloseDocument={closeDocument}
        />
      </div>
    </div>
  );
};
