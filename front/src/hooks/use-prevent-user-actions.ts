import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { useClipboardGuard } from "./user-actions/use-clipboard-guard";
import { useClipboardViolationTracker } from "./user-actions/use-clipboard-violation-tracker";
import { useContextMenuGuard } from "./user-actions/use-context-menu-guard";
import { useDevToolsGuard } from "./user-actions/use-devtools-guard";
import { useKeyboardShortcutGuard } from "./user-actions/use-keyboard-shortcut-guard";
import { ClipboardAction, SecurityViolationReason } from "./user-actions/types";

interface UsePreventUserActionsOptions {
  enabled?: boolean;
  allowedDragAreaSelector?: string;
  allowedDragMimeType?: string;
  clipboardViolationLimit?: number;
  onClipboardViolation?: (action: ClipboardAction, attempts: number) => void;
  onClipboardViolationLimit?: (
    action: ClipboardAction,
    attempts: number,
  ) => void;
  onSecurityViolation?: (
    reason: SecurityViolationReason,
  ) => Promise<void> | void;
}

export function usePreventUserActions({
  enabled = true,
  allowedDragAreaSelector,
  allowedDragMimeType,
  clipboardViolationLimit = 10,
  onClipboardViolation,
  onClipboardViolationLimit,
  onSecurityViolation,
}: UsePreventUserActionsOptions = {}) {
  const { back } = useRouter();
  const hasHandledDevToolsViolation = useRef(false);

  const registerClipboardAttempt = useClipboardViolationTracker({
    violationLimit: clipboardViolationLimit,
    onViolation: onClipboardViolation,
    onViolationLimit: onClipboardViolationLimit,
  });

  const handleDevToolsDetected = useCallback(
    async (reason: SecurityViolationReason) => {
      if (hasHandledDevToolsViolation.current) {
        return;
      }

      hasHandledDevToolsViolation.current = true;
      await onSecurityViolation?.(reason);
      window.setTimeout(() => {
        alert(
          "DevTools detectado, você será suspenso da tarefa. Entre em contato com o responsável pela tarefa, se acha que é um erro.",
        );
        back();
      }, 0);
    },
    [back, onSecurityViolation],
  );

  useContextMenuGuard({
    enabled,
    allowedDragAreaSelector,
    allowedDragMimeType
  });
  useClipboardGuard({ enabled, onClipboardAttempt: registerClipboardAttempt });
  useKeyboardShortcutGuard({
    enabled,
    onClipboardShortcut: registerClipboardAttempt,
  });
  useDevToolsGuard({ enabled, onDetected: handleDevToolsDetected });
}
