// src/lib/registerSymbolHotkeys.ts
import { loader } from "@monaco-editor/react";
import type * as monacoType from "monaco-editor";
import { allSymbols } from "@/components/editor/CommandPalette";

export async function registerSymbolHotkeys(editor: monacoType.editor.IStandaloneCodeEditor) {
  const monaco = await loader.init();
  const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

  const parseHotkey = (keyStr: string): number | undefined => {
    if (!keyStr) return undefined;
    let binding = 0;
    const parts = keyStr.split("+").map((p) => p.trim().toLowerCase());

    for (const part of parts) {
      if (part === "ctrl" || part === "cmd") binding |= monaco.KeyMod.CtrlCmd;
      else if (part === "alt" || part === "option") binding |= monaco.KeyMod.Alt;
      else if (part === "shift") binding |= monaco.KeyMod.Shift;
      else {
        const key =
          part.length === 1
            ? monaco.KeyCode[`Key${part.toUpperCase()}` as keyof typeof monaco.KeyCode]
            : (monaco.KeyCode as any)[part.toUpperCase()];
        if (key) binding |= key;
      }
    }

    return binding;
  };

  for (const s of allSymbols) {
    if (!s.key) continue;
    const normalizedKey = s.key.replace("Cmd", isMac ? "Cmd" : "Ctrl");
    const binding = parseHotkey(normalizedKey);
    if (!binding) continue;

    const id = `insert-${s.code.replace(/[^a-z0-9]/gi, "_")}`;

    // ✅ Register the Monaco Action (adds to Command Palette)
    editor.addAction({
      id,
      label: `Insert ${s.label}`,
      keybindings: [binding],
      contextMenuGroupId: "insertSymbols",
      contextMenuOrder: 1,
      run: () => {
        const position = editor.getPosition();
        if (!position) return;
        editor.executeEdits("", [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: s.code,
          },
        ]);
        editor.focus();
      },
    });
  }

  console.log("✅ Registered symbol hotkeys + command palette actions:", allSymbols.length);
}
