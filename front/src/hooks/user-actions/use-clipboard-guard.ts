import { useEffect } from "react";
import { ClipboardAction, RegisterClipboardAttempt } from "./types";

interface UseClipboardGuardOptions {
  onClipboardAttempt: RegisterClipboardAttempt;
}

const CLIPBOARD_ACTIONS = new Set<ClipboardAction>(["copy", "cut", "paste"]);

export function useClipboardGuard({
  onClipboardAttempt,
}: UseClipboardGuardOptions) {
  useEffect(() => {
    const preventClipboardAction = (event: ClipboardEvent) => {
      event.preventDefault();

      if (CLIPBOARD_ACTIONS.has(event.type as ClipboardAction)) {
        onClipboardAttempt(event.type as ClipboardAction);
      }

      alert(
        "Ação não permitida. Por favor, não copie ou cole conteúdo enquanto estiver no editor.",
      );
      return false;
    };

    document.addEventListener("copy", preventClipboardAction, true);
    document.addEventListener("cut", preventClipboardAction, true);
    document.addEventListener("paste", preventClipboardAction, true);

    return () => {
      document.removeEventListener("copy", preventClipboardAction, true);
      document.removeEventListener("cut", preventClipboardAction, true);
      document.removeEventListener("paste", preventClipboardAction, true);
    };
  }, [onClipboardAttempt]);
}
