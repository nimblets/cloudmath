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

    // --- Exposed Methods ---
    useImperativeHandle(ref, () => ({
      insertAtCursor: (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const selection = editor.getSelection();
        const position = selection ? selection.getStartPosition() : editor.getPosition();

        if (position) {
          editor.executeEdits("", [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
              text,
            },
          ]);

          const lines = text.split("\n");
          const newPosition = {
            lineNumber: position.lineNumber + lines.length - 1,
            column:
              lines.length === 1
                ? position.column + text.length
                : lines[lines.length - 1].length + 1,
          };
          editor.setPosition(newPosition);
          editor.focus();
        }
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }));

    // --- Field scanning / cycling ---
    const scanCurrentLineForFields = (): boolean => {
      const editor = editorRef.current;
      if (!editor) return false;

      const pos = editor.getPosition();
      const lineContent = editor.getModel()?.getLineContent(pos.lineNumber) || "";

      const matches = [...lineContent.matchAll(/\{.*?\}/g)];
      if (matches.length === 0) return false; // <-- no fields, do nothing

      fieldPositions.current = matches.map((m) => {
        const col = (m.index || 0) + 1;
        return {
          start: { lineNumber: pos.lineNumber, column: col },
          end: { lineNumber: pos.lineNumber, column: col + m[0].length },
        };
      });

      setCurrentLineLatex(lineContent);
      const coords = editor.getScrolledVisiblePosition(pos);
      if (coords) setCursorCoords({ top: coords.top, left: coords.left });

      return true; // <-- fields exist
    };


    const moveToField = (index: number) => {
      const editor = editorRef.current;
      if (!editor) return;
      if (!fieldPositions.current[index]) return;

      const field = fieldPositions.current[index];
      editor.setSelection({
        startLineNumber: field.start.lineNumber,
        startColumn: field.start.column,
        endLineNumber: field.end.lineNumber,
        endColumn: field.end.column,
      });
      editor.focus();
      currentFieldIndex.current = index;

      // Update bubble
      const lineContent =
        editor.getModel()?.getLineContent(field.start.lineNumber) || "";
      setCurrentLineLatex(lineContent);

      const coords = editor.getScrolledVisiblePosition(editor.getPosition());
      if (coords) setCursorCoords({ top: coords.top, left: coords.left });
    };

    const cycleToNextField = () => {
      if (fieldPositions.current.length === 0) return;
      const nextIndex = (currentFieldIndex.current + 1) % fieldPositions.current.length;
      moveToField(nextIndex);
    };

    // --- Initialize Monaco + hotkeys ---
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
          colors: {
            "editor.background": "#ffffffff",
            "editor.foreground": "#000000",
          },
        });

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
          colors: {
            "editor.background": "#1e1e1e",
            "editor.foreground": "#d4d4d4",
          },
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
          
            editor.onDidChangeCursorSelection(() => {
              if (!speedCycleActive.current) return;

              const pos = editor.getPosition();
              const field = fieldPositions.current[currentFieldIndex.current];
              if (!field) return;

              // Check if cursor is still inside current field
              if (
                pos.lineNumber === field.start.lineNumber &&
                pos.column >= field.start.column &&
                pos.column <= field.end.column
              ) {
                const lineContent = editor.getModel()?.getLineContent(pos.lineNumber) || "";
                setCurrentLineLatex(lineContent);

                const coords = editor.getScrolledVisiblePosition(pos);
                if (coords) setCursorCoords({ top: coords.top, left: coords.left });
              }
            });

            editor.onDidChangeModelContent(() => {
              if (!speedCycleActive.current) return;

              // Update current line's KaTeX preview live
              const pos = editor.getPosition();
              const lineContent = editor.getModel()?.getLineContent(pos.lineNumber) || "";
              setCurrentLineLatex(lineContent);

              const coords = editor.getScrolledVisiblePosition(pos);
              if (coords) setCursorCoords({ top: coords.top, left: coords.left });
            });

            await registerSymbolHotkeys(editor);

            editor.onKeyDown((e) => {
              // Activate speed cycle with Shift+Tab
              if (e.shiftKey && e.code === "Tab") {
                const hasFields = scanCurrentLineForFields();
                if (!hasFields) return; // <-- do nothing if no fields

                e.preventDefault();
                speedCycleActive.current = true;
                moveToField(0);
              }

              // Cycle fields when active
              if (speedCycleActive.current) {
                if (e.code === "Tab" || e.code === "Enter") {
                  e.preventDefault();
                  cycleToNextField();
                }
              }
            });

            editor.onKeyUp((e) => {
              if (e.code === "Tab" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
                speedCycleActive.current = false;
                currentFieldIndex.current = 0;
                fieldPositions.current = [];
              }
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
            overviewRulerBorder: true,
            hideCursorInOverviewRuler: true,
            overviewRulerLanes: 0,
            renderOverviewRuler: true,
            scrollbar: { vertical: "visible", horizontal: "visible" },
            bracketPairColorization: { enabled: true },
            matchBrackets: "always",
          }}
        />

        {/* Floating KaTeX Bubble */}
        {speedCycleActive.current && (
          <div
            className="absolute bg-white border rounded p-1 shadow z-50"
            style={{ top: cursorCoords.top, left: cursorCoords.left, pointerEvents: "none" }}
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
