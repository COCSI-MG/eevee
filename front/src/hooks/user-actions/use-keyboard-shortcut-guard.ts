import { useEffect } from "react";
import { ClipboardAction, RegisterClipboardAttempt } from "./types";

interface UseKeyboardShortcutGuardOptions {
  onClipboardShortcut: RegisterClipboardAttempt;
}

const BLOCKED_MODIFIER_KEYS = new Set(["a", "c", "s", "u", "v", "x"]);
const CLIPBOARD_SHORTCUTS: Record<string, ClipboardAction> = {
  c: "copy",
  v: "paste",
  x: "cut",
};

function isBlockedKeyboardShortcut(event: KeyboardEvent) {
  const isModifierShortcut = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  return (
    event.key === "F12" ||
    (isModifierShortcut && event.shiftKey && key === "i") ||
    (isModifierShortcut && BLOCKED_MODIFIER_KEYS.has(key))
  );
}

export function useKeyboardShortcutGuard({
  onClipboardShortcut,
}: UseKeyboardShortcutGuardOptions) {
  useEffect(() => {
    const preventKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!isBlockedKeyboardShortcut(event)) {
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

    document.addEventListener("keydown", preventKeyboardShortcuts, true);

    return () => {
      document.removeEventListener("keydown", preventKeyboardShortcuts, true);
    };
  }, [onClipboardShortcut]);
}
