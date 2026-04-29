import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useClipboardGuard } from "./user-actions/use-clipboard-guard";
import { useClipboardViolationTracker } from "./user-actions/use-clipboard-violation-tracker";
import { useContextMenuGuard } from "./user-actions/use-context-menu-guard";
import { useDevToolsGuard } from "./user-actions/use-devtools-guard";
import { useKeyboardShortcutGuard } from "./user-actions/use-keyboard-shortcut-guard";
import { ClipboardAction } from "./user-actions/types";

interface UsePreventUserActionsOptions {
  clipboardViolationLimit?: number;
  onClipboardViolation?: (action: ClipboardAction, attempts: number) => void;
  onClipboardViolationLimit?: (
    action: ClipboardAction,
    attempts: number,
  ) => void;
}

export function usePreventUserActions({
  clipboardViolationLimit = 10,
  onClipboardViolation,
  onClipboardViolationLimit,
}: UsePreventUserActionsOptions = {}) {
  const { back } = useRouter();

  const registerClipboardAttempt = useClipboardViolationTracker({
    violationLimit: clipboardViolationLimit,
    onViolation: onClipboardViolation,
    onViolationLimit: onClipboardViolationLimit,
  });

  const handleDevToolsDetected = useCallback(() => {
    back();
    alert("Devtools detected! Please close them to continue.");
  }, [back]);

  useContextMenuGuard();
  useClipboardGuard({ onClipboardAttempt: registerClipboardAttempt });
  useKeyboardShortcutGuard({ onClipboardShortcut: registerClipboardAttempt });
  useDevToolsGuard({ onDetected: handleDevToolsDetected });
}
