import { useEffect } from "react";
import { CLIPBOARD_ACTION } from "@/constants/clipboard-action";
import { EDITOR_ACTION_GUARD_MODE } from "@/constants/editor-action-guard";
import { getEditorActionGuard } from "./editor-action-guard";
import { ClipboardAction, RegisterClipboardAttempt } from "./types";

interface UseKeyboardShortcutGuardOptions {
  enabled: boolean;
  onClipboardShortcut: RegisterClipboardAttempt;
  onDevToolsShortcut: () => void;
}

const BLOCKED_MODIFIER_KEYS = new Set(["a", "c", "s", "u", "v", "x"]);
const BLOCKED_DEVTOOLS_KEYS = new Set(["c", "i", "j", "k"]);
const CLIPBOARD_SHORTCUTS: Record<string, ClipboardAction> = {
  c: CLIPBOARD_ACTION.COPY,
  v: CLIPBOARD_ACTION.PASTE,
  x: CLIPBOARD_ACTION.CUT,
};

function isDevToolsShortcut(event: KeyboardEvent) {
  const isModifierShortcut = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  return (
    event.key === "F12" ||
    (
      isModifierShortcut &&
      (event.shiftKey || (event.metaKey && event.altKey)) &&
      BLOCKED_DEVTOOLS_KEYS.has(key)
    )
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
  onDevToolsShortcut
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

      const key = event.key.toLowerCase();
      const focusedEditorGuard = getEditorActionGuard(event.target);
      const isInternalClipboardShortcut = focusedEditorGuard?.mode === EDITOR_ACTION_GUARD_MODE.INTERNAL_ONLY && key in CLIPBOARD_SHORTCUTS;

      if (
        !isDevToolsAction &&
        (focusedEditorGuard?.mode === EDITOR_ACTION_GUARD_MODE.EXEMPT || isInternalClipboardShortcut)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (isDevToolsAction) {
        onDevToolsShortcut();
        return false;
      }

      if (key in CLIPBOARD_SHORTCUTS) {
        onClipboardShortcut(CLIPBOARD_SHORTCUTS[key]);
      }
      return false;
    };

    window.addEventListener("keydown", preventKeyboardShortcuts, true);
    document.addEventListener("keydown", preventKeyboardShortcuts, true);

    return () => {
      window.removeEventListener("keydown", preventKeyboardShortcuts, true);
      document.removeEventListener("keydown", preventKeyboardShortcuts, true);
    };
  }, [enabled, onClipboardShortcut, onDevToolsShortcut]);
}
