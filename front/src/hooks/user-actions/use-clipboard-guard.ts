import { useEffect } from "react";
import { CLIPBOARD_ACTION } from "@/constants/clipboard-action";
import { EDITOR_ACTION_GUARD_MODE } from "@/constants/editor-action-guard";
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

const CLIPBOARD_ACTIONS = Object.values(CLIPBOARD_ACTION);
const CLIPBOARD_ACTION_SET = new Set<ClipboardAction>(CLIPBOARD_ACTIONS);

type ClipboardActionListener = (event: ClipboardEvent) => void | false;

function registerClipboardActionListeners(listener: ClipboardActionListener) {
  for (const action of CLIPBOARD_ACTIONS) {
    window.addEventListener(action, listener, true);
    document.addEventListener(action, listener, true);
  }

  return () => {
    for (const action of CLIPBOARD_ACTIONS) {
      window.removeEventListener(action, listener, true);
      document.removeEventListener(action, listener, true);
    }
  };
}

export function useClipboardGuard({
  enabled,
  onClipboardAttempt,
}: UseClipboardGuardOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const blockClipboardEvent = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const preventClipboardAction = (event: ClipboardEvent) => {
      const action = event.type as ClipboardAction;
      const focusedEditorGuard = getEditorActionGuard(event.target);

      if (focusedEditorGuard?.mode === EDITOR_ACTION_GUARD_MODE.EXEMPT) {
        return;
      }

      if (focusedEditorGuard?.mode === EDITOR_ACTION_GUARD_MODE.INTERNAL_ONLY) {
        const clipboardScope = focusedEditorGuard.clipboardScope;

        if (action === CLIPBOARD_ACTION.COPY || action === CLIPBOARD_ACTION.CUT) {
          if (clipboardScope) {
            captureInternalEditorClipboard(
              event,
              focusedEditorGuard.editorInstance,
              clipboardScope,
              action,
            );
          } else {
            blockClipboardEvent(event);
            onClipboardAttempt(action);
          }

          return false;
        }

        blockClipboardEvent(event);

        if (
          clipboardScope &&
          pasteInternalEditorClipboard(
            event,
            focusedEditorGuard.editorInstance,
            clipboardScope,
          )
        ) return false;

        if (clipboardScope) clearInternalEditorClipboard(clipboardScope);

        onClipboardAttempt(CLIPBOARD_ACTION.PASTE);

        alert("Ação não permitida. Cole apenas conteúdo copiado dentro desta atividade.");
        return false;
      }

      blockClipboardEvent(event);

      if (CLIPBOARD_ACTION_SET.has(action)) {
        onClipboardAttempt(action);
      }

      alert("Ação não permitida. Por favor, não copie ou cole conteúdo enquanto estiver no editor.");
      return false;
    };

    return registerClipboardActionListeners(preventClipboardAction);
  }, [enabled, onClipboardAttempt]);
}
