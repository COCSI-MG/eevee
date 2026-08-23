import { useEffect } from "react";
import { isFocusedEditorExemptFromActionGuards } from "./editor-action-guard";
import { ClipboardAction, RegisterClipboardAttempt } from "./types";

interface UseKeyboardShortcutGuardOptions {
  enabled: boolean;
  onClipboardShortcut: RegisterClipboardAttempt;
}

const BLOCKED_MODIFIER_KEYS = new Set(["a", "c", "s", "u", "v", "x"]);
const BLOCKED_DEVTOOLS_KEYS = new Set(["c", "i", "j"]);
const CLIPBOARD_SHORTCUTS: Record<string, ClipboardAction> = {
  c: "copy",
  v: "paste",
  x: "cut",
};

function isDevToolsShortcut(event: KeyboardEvent) {
  const isModifierShortcut = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  return (
    event.key === "F12" ||
    (isModifierShortcut && event.shiftKey && BLOCKED_DEVTOOLS_KEYS.has(key))
  );
}

function isBlockedModifierShortcut(event: KeyboardEvent) {
  const isModifierShortcut = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  return isModifierShortcut && BLOCKED_MODIFIER_KEYS.has(key);
}

export function useKeyboardShortcutGuard({
  enabled,
  onClipboardShortcut,
}: UseKeyboardShortcutGuardOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const preventKeyboardShortcuts = (event: KeyboardEvent) => {
      const isDevToolsAction = isDevToolsShortcut(event);
      const isBlockedModifierAction = isBlockedModifierShortcut(event);

      if (!isDevToolsAction && !isBlockedModifierAction) {
        return;
      }

      if (!isDevToolsAction && isFocusedEditorExemptFromActionGuards()) {
        return;
      }

      const key = event.key.toLowerCase();

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (key in CLIPBOARD_SHORTCUTS) {
        onClipboardShortcut(CLIPBOARD_SHORTCUTS[key]);
      }

      alert(
        "Ação não permitida. Por favor, não use atalhos de teclado enquanto estiver no editor.",
      );
      return false;
    };

    window.addEventListener("keydown", preventKeyboardShortcuts, true);
    document.addEventListener("keydown", preventKeyboardShortcuts, true);

    return () => {
      window.removeEventListener("keydown", preventKeyboardShortcuts, true);
      document.removeEventListener("keydown", preventKeyboardShortcuts, true);
    };
  }, [enabled, onClipboardShortcut]);
}
