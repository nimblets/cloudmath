import Editor from "@monaco-editor/react";
import { useTheme } from "@/hooks/useTheme";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ value, onChange }: CodeEditorProps) => {
  const theme = useTheme();

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="latex"
        value={value}
        onChange={(value) => onChange(value || "")}
        theme={theme === "dark" ? "vs-dark" : "vs"}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: '"JetBrains Mono", monospace',
          lineNumbers: "on",
          rulers: [80],
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          overviewRulerLanes: 0,
          renderOverviewRuler: false,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
};
