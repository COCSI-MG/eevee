import { useEffect } from "react";
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
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (CLIPBOARD_ACTIONS.has(event.type as ClipboardAction)) {
        onClipboardAttempt(event.type as ClipboardAction);
      }

      alert(
        "Ação não permitida. Por favor, não copie ou cole conteúdo enquanto estiver no editor.",
      );
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
