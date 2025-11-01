// src/lib/hotkeys.ts
export const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Normalize a hotkey string like "Cmd+Shift+L" or "Ctrl+Alt+K"
 * into an array of parts: ["cmd","shift","l"]
 */
export function normalizeHotkey(keyStr: string) {
  return keyStr
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Format a hotkey for display on the current platform.
 * Examples:
 *  - mac: "cmd+shift+k" -> "⌘ ⇧ K"
 *  - windows: "cmd+shift+k" -> "Ctrl Shift K"
 */
export function formatKeyForPlatform(keyStr: string): string {
  const parts = normalizeHotkey(keyStr);
  const out: string[] = [];

  for (const p of parts) {
    if (p === "cmd" || p === "ctrl") {
      out.push(isMac ? "⌘" : "Ctrl");
    } else if (p === "option" || p === "alt") {
      out.push(isMac ? "⌥" : "Alt");
    } else if (p === "shift") {
      out.push(isMac ? "⇧" : "Shift");
    } else if (p.length === 1) {
      out.push(p.toUpperCase());
    } else {
      // fallback for named keys like "enter", "slash", "left"
      out.push(p.replace(/^key/i, "").toUpperCase());
    }
  }

  return out.join(" ");
}

/**
 * Check whether a KeyboardEvent matches a hotkey string on this platform.
 * Works for combos like "Cmd+Shift+L", "Ctrl+S", "Alt+A", "Ctrl+Shift+D"
 */
export function matchHotkeyEvent(keyStr: string, e: KeyboardEvent): boolean {
  const parts = normalizeHotkey(keyStr);
  if (parts.length === 0) return false;

  const wantsCtrlOrCmd = parts.includes("ctrl") || parts.includes("cmd");
  const wantsAlt = parts.includes("alt") || parts.includes("option");
  const wantsShift = parts.includes("shift");

  // Determine actual ctrl-like modifier pressed on this platform:
  // On mac, "Cmd" is the metaKey; treat "cmd" as meta and "ctrl" as ctrl if user specified ctrl explicitly.
  // We'll interpret "cmd" or "ctrl" in the keyStr as "CtrlCmd" equivalently so both map to platform modifier.
  const platformModifierPressed = isMac ? e.metaKey : e.ctrlKey;
  const ctrlPressed = e.ctrlKey;
  const metaPressed = e.metaKey;

  // Evaluate the modifier booleans:
  // If the hotkey asked for ctrl/cmd, require platformModifierPressed === true.
  if (wantsCtrlOrCmd !== platformModifierPressed) return false;
  if (wantsAlt !== e.altKey) return false;
  if (wantsShift !== e.shiftKey) return false;

  // The final part should be the main key (last token)
  const keyToken = parts[parts.length - 1];
  // For single letter tokens, match e.key ignoring case
  if (keyToken.length === 1) {
    return e.key.toLowerCase() === keyToken.toLowerCase();
  }

  // Common named keys mapping
  const namedKeyMap: Record<string, string> = {
    enter: "Enter",
    esc: "Escape",
    escape: "Escape",
    space: " ",
    tab: "Tab",
    slash: "/",
    comma: ",",
    period: ".",
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
  };

  const expected = namedKeyMap[keyToken] ?? keyToken;
  return e.key.toLowerCase() === expected.toLowerCase();
}
