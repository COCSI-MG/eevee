import { useEffect } from "react";
import { getEditorActionGuard } from "./editor-action-guard";
import {
  captureInternalEditorClipboard,
  clearInternalEditorClipboard,
  pasteInternalEditorClipboard,
} from "./internal-editor-clipboard";
import { ClipboardAction, RegisterClipboardAttempt } from "./types";

interface UseClipboardGuardOptions {
  enabled: boolean;
  onClipboardAttempt: RegisterClipboardAttempt;
}

const CLIPBOARD_ACTIONS = new Set<ClipboardAction>(["copy", "cut", "paste"]);

export function useClipboardGuard({
  enabled,
  onClipboardAttempt,
}: UseClipboardGuardOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const preventClipboardAction = (event: ClipboardEvent) => {
      const action = event.type as ClipboardAction;
      const focusedEditorGuard = getEditorActionGuard(event.target);

      if (focusedEditorGuard?.mode === "exempt") {
        return;
      }

      if (focusedEditorGuard?.mode === "internal-only") {
        const clipboardScope = focusedEditorGuard.clipboardScope;

        if (action === "copy" || action === "cut") {
          if (clipboardScope) {
            captureInternalEditorClipboard(
              event,
              focusedEditorGuard.editorInstance,
              clipboardScope,
              action,
            );
          } else {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            onClipboardAttempt(action);
          }

          return false;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (
          clipboardScope &&
          pasteInternalEditorClipboard(
            event,
            focusedEditorGuard.editorInstance,
            clipboardScope,
          )
        ) return false;

        if (clipboardScope) clearInternalEditorClipboard(clipboardScope);

        onClipboardAttempt("paste");

        alert("Ação não permitida. Cole apenas conteúdo copiado dentro desta atividade.");
        return false;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (CLIPBOARD_ACTIONS.has(action)) {
        onClipboardAttempt(action);
      }

      alert("Ação não permitida. Por favor, não copie ou cole conteúdo enquanto estiver no editor.");
      return false;
    };

    window.addEventListener("copy", preventClipboardAction, true);
    window.addEventListener("cut", preventClipboardAction, true);
    window.addEventListener("paste", preventClipboardAction, true);
    document.addEventListener("copy", preventClipboardAction, true);
    document.addEventListener("cut", preventClipboardAction, true);
    document.addEventListener("paste", preventClipboardAction, true);

    return () => {
      window.removeEventListener("copy", preventClipboardAction, true);
      window.removeEventListener("cut", preventClipboardAction, true);
      window.removeEventListener("paste", preventClipboardAction, true);
      document.removeEventListener("copy", preventClipboardAction, true);
      document.removeEventListener("cut", preventClipboardAction, true);
      document.removeEventListener("paste", preventClipboardAction, true);
    };
  }, [enabled, onClipboardAttempt]);
}
