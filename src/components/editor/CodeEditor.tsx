import Editor, { loader } from "@monaco-editor/react";
import { useTheme } from "@/hooks/useTheme";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { registerSymbolHotkeys } from "@/lib/registerSymbolHotkeys";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface CodeEditorRef {
  insertAtCursor: (text: string) => void;
  focus: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({ value, onChange }, ref) => {
  const theme = useTheme();
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    insertAtCursor: (text: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      
      const selection = editor.getSelection();
      const position = selection ? selection.getStartPosition() : editor.getPosition();
      
      if (position) {
        editor.executeEdits('', [{
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
          },
          text: text
        }]);
        
        // Move cursor to end of inserted text
        const lines = text.split('\n');
        const newPosition = {
          lineNumber: position.lineNumber + lines.length - 1,
          column: lines.length === 1 ? position.column + text.length : lines[lines.length - 1].length + 1
        };
        editor.setPosition(newPosition);
        editor.focus();
      }
    },
    focus: () => {
      editorRef.current?.focus();
    }
  }));

  useEffect(() => {
    loader.init().then((monaco) => {
      // Define custom LaTeX language configuration
      monaco.languages.register({ id: 'latex' });
      
      monaco.languages.setMonarchTokensProvider('latex', {
        tokenizer: {
          root: [
            [/\\[a-zA-Z@]+/, 'keyword'],
            [/\\[^a-zA-Z@]/, 'keyword'],
            [/\{/, 'delimiter.curly'],
            [/\}/, 'delimiter.curly'],
            [/\[/, 'delimiter.square'],
            [/\]/, 'delimiter.square'],
            [/%.*$/, 'comment'],
            [/\$\$/, 'string', '@displaymath'],
            [/\$/, 'string', '@inlinemath'],
            [/\\begin\{[^}]+\}/, 'keyword.control'],
            [/\\end\{[^}]+\}/, 'keyword.control'],
          ],
          displaymath: [
            [/\$\$/, 'string', '@pop'],
            [/[^$]+/, 'string.math'],
          ],
          inlinemath: [
            [/\$/, 'string', '@pop'],
            [/[^$]+/, 'string.math'],
          ],
        },
      });

      // Define custom theme that follows system theme
      monaco.editor.defineTheme('latex-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
          { token: 'keyword.control', foreground: 'AF00DB', fontStyle: 'bold' },
          { token: 'comment', foreground: '008000', fontStyle: 'italic' },
          { token: 'string', foreground: 'A31515' },
          { token: 'string.math', foreground: '098658' },
          { token: 'delimiter.curly', foreground: '000000', fontStyle: 'bold' },
          { token: 'delimiter.square', foreground: '000000' },
        ],
        colors: {
          'editor.background': '#ffffffff',
          'editor.foreground': '#000000',
        }
      });

      monaco.editor.defineTheme('latex-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
          { token: 'keyword.control', foreground: 'C586C0', fontStyle: 'bold' },
          { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'string.math', foreground: '4EC9B0' },
          { token: 'delimiter.curly', foreground: 'FFD700', fontStyle: 'bold' },
          { token: 'delimiter.square', foreground: 'DA70D6' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
        }
      });
    });
  }, []);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="latex"
        value={value}
        onChange={(value) => onChange(value || "")}
        onMount={async (editor) => {
          editorRef.current = editor;
          await registerSymbolHotkeys(editor);
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
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          bracketPairColorization: {
            enabled: true,
          },
          matchBrackets: 'always',
        }}
      />
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
