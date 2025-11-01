// src/components/editor/CodeEditor.tsx
import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "@/hooks/useTheme";
import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { registerSymbolHotkeys } from "@/lib/registerSymbolHotkeys";
import katex from "katex";
import "katex/dist/katex.min.css";
import type * as monacoType from "monaco-editor";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface CodeEditorRef {
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ value, onChange }, ref) => {
    const theme = useTheme();
    const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);

    // --- Speed Cycle State ---
    const speedCycleActive = useRef(false);
    const currentFieldIndex = useRef(0);
    const fieldPositions = useRef<
      { start: monacoType.Position; end: monacoType.Position }[]
    >([]);

    // Bubble preview
    const [cursorCoords, setCursorCoords] = useState<{ top: number; left: number }>({
      top: 0,
      left: 0,
    });
    const [currentLineLatex, setCurrentLineLatex] = useState("");

    // --- Utility: scan current line for {} fields ---
    const scanCurrentLineForFields = (): boolean => {
      const editor = editorRef.current;
      if (!editor) return false;

      const pos = editor.getPosition();
      const lineContent = editor.getModel()?.getLineContent(pos.lineNumber) || "";

      const matches = [...lineContent.matchAll(/\{.*?\}/g)];
      if (matches.length === 0) return false;

      // Determine cursor placement inside {} without skipping
      fieldPositions.current = matches.map((m) => {
        const col = (m.index || 0) + 2; // cursor inside {}
        return {
          start: { lineNumber: pos.lineNumber, column: col },
          end: { lineNumber: pos.lineNumber, column: col }, // just cursor, no highlight
        };
      });

      setCurrentLineLatex(lineContent);

     const coords = editor.getScrolledVisiblePosition({ lineNumber: pos.lineNumber, column: 1 });
     if (coords) setCursorCoords({ top: coords.top - 20, left: 5 });

      return true;
    };

    const moveToField = (index: number) => {
      const editor = editorRef.current;
      if (!editor || !fieldPositions.current[index]) return;

      const field = fieldPositions.current[index];
      editor.setPosition(field.start); // place cursor inside {}
      editor.focus();
      currentFieldIndex.current = index;

      const lineContent = editor.getModel()?.getLineContent(field.start.lineNumber) || "";
      setCurrentLineLatex(lineContent);

      const coords = editor.getScrolledVisiblePosition({ lineNumber: pos.lineNumber, column: 1 });
      if (coords) setCursorCoords({ top: coords.top - 20, left: 5 });

    };

    const cycleToNextField = () => {
      if (fieldPositions.current.length === 0) return;
      const nextIndex = (currentFieldIndex.current + 1) % fieldPositions.current.length;
      moveToField(nextIndex);
    };

    // --- Exposed Methods ---
    useImperativeHandle(ref, () => ({
      insertAtCursor: (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const pos = editor.getPosition();
        if (!pos) return;

        editor.executeEdits("", [
          {
            range: {
              startLineNumber: pos.lineNumber,
              startColumn: pos.column,
              endLineNumber: pos.lineNumber,
              endColumn: pos.column,
            },
            text,
          },
        ]);

        editor.setPosition({
          lineNumber: pos.lineNumber,
          column: pos.column + text.length,
        });
        editor.focus();
      },
      focus: () => editorRef.current?.focus(),
    }));

    // --- Initialize Monaco Editor ---
    useEffect(() => {
      loader.init().then((monaco) => {
        monaco.languages.register({ id: "latex" });
        monaco.languages.setMonarchTokensProvider("latex", {
          tokenizer: {
            root: [
              [/\\[a-zA-Z@]+/, "keyword"],
              [/\\[^a-zA-Z@]/, "keyword"],
              [/\{/, "delimiter.curly"],
              [/\}/, "delimiter.curly"],
              [/\[/, "delimiter.square"],
              [/\]/, "delimiter.square"],
              [/%.*$/, "comment"],
              [/\$\$/, "string", "@displaymath"],
              [/\$/, "string", "@inlinemath"],
              [/\\begin\{[^}]+\}/, "keyword.control"],
              [/\\end\{[^}]+\}/, "keyword.control"],
            ],
            displaymath: [
              [/\$\$/, "string", "@pop"],
              [/[^$]+/, "string.math"],
            ],
            inlinemath: [[/\$/, "string", "@pop"], [/[^$]+/, "string.math"]],
          },
        });

        // Light theme
        monaco.editor.defineTheme("latex-light", {
          base: "vs",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
            { token: "keyword.control", foreground: "AF00DB", fontStyle: "bold" },
            { token: "comment", foreground: "008000", fontStyle: "italic" },
            { token: "string", foreground: "A31515" },
            { token: "string.math", foreground: "098658" },
            { token: "delimiter.curly", foreground: "000000", fontStyle: "bold" },
            { token: "delimiter.square", foreground: "000000" },
          ],
          colors: { "editor.background": "#ffffffff", "editor.foreground": "#000000" },
        });

        // Dark theme
        monaco.editor.defineTheme("latex-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
            { token: "keyword.control", foreground: "C586C0", fontStyle: "bold" },
            { token: "comment", foreground: "6A9955", fontStyle: "italic" },
            { token: "string", foreground: "CE9178" },
            { token: "string.math", foreground: "4EC9B0" },
            { token: "delimiter.curly", foreground: "FFD700", fontStyle: "bold" },
            { token: "delimiter.square", foreground: "DA70D6" },
          ],
          colors: { "editor.background": "#1e1e1e", "editor.foreground": "#d4d4d4" },
        });
      });
    }, []);

    return (
      <div className="relative h-full w-full">
        <Editor
          height="100%"
          defaultLanguage="latex"
          value={value}
          onChange={(v) => onChange(v || "")}
          onMount={async (editor) => {
            editorRef.current = editor;
            await registerSymbolHotkeys(editor);

            // --- Key handling ---
            editor.onKeyDown((e) => {
              // Alt+Hold activates
              if (e.altKey && !speedCycleActive.current) {
                const hasFields = scanCurrentLineForFields();
                if (!hasFields) return;
                speedCycleActive.current = true;
                moveToField(0);
              }

              // Enter cycles
              if (speedCycleActive.current && e.code === "Enter") {
                e.preventDefault();
                cycleToNextField();
              }
            });

            // Alt release deactivates
            editor.onKeyUp(() => {
              if (!editorRef.current) return;
              if (!window.event?.altKey) {
                speedCycleActive.current = false;
                currentFieldIndex.current = 0;
                fieldPositions.current = [];
              }
            });

            // Live KaTeX update
            editor.onDidChangeModelContent(() => {
              if (!speedCycleActive.current) return;
              const pos = editor.getPosition();
              const lineContent = editor.getModel()?.getLineContent(pos.lineNumber) || "";
              setCurrentLineLatex(lineContent);

              const coords = editor.getScrolledVisiblePosition(pos);
              if (coords) setCursorCoords({ top: coords.top - 5, left: coords.left });
            });
          }}
          theme={theme === "dark" ? "latex-dark" : "latex-light"}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            bracketPairColorization: { enabled: true },
            matchBrackets: "always",
          }}
        />

        {/* KaTeX Bubble */}
        {speedCycleActive.current && (
          <div
            className="absolute bg-white border rounded p-1 shadow z-50"
            style={{
              top: cursorCoords.top,
              left: cursorCoords.left,
              pointerEvents: "none",
            }}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(currentLineLatex || "", { throwOnError: false }),
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

CodeEditor.displayName = "CodeEditor";
