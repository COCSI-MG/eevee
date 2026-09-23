import { useCallback, useEffect, useRef } from "react";
import { useClipboardGuard } from "./user-actions/use-clipboard-guard";
import { useContextMenuGuard } from "./user-actions/use-context-menu-guard";
import { useDevToolsGuard } from "./user-actions/use-devtools-guard";
import { useKeyboardShortcutGuard } from "./user-actions/use-keyboard-shortcut-guard";
import {
  ClipboardAction,
  SecurityViolationEvent,
  SecurityViolationReason,
} from "./user-actions/types";
import {
  AssignmentAlertType,
  type AssignmentAlertDetails,
} from "@/app/interface/scheduler-api/assignment-alert";

const DEVTOOLS_SHORTCUT_REASON = "devtools_shortcut";

const DEVTOOLS_SIGNAL_BY_REASON = {
  [DEVTOOLS_SHORTCUT_REASON]: "shortcut",
  devtools_console: "console",
  devtools_debugger: "debugger",
  devtools_performance: "performance",
  devtools_viewport: "viewport",
} as const satisfies Record<
  SecurityViolationReason | typeof DEVTOOLS_SHORTCUT_REASON,
  NonNullable<AssignmentAlertDetails["devtoolsSignal"]>
>;

type DevToolsDetectionReason = keyof typeof DEVTOOLS_SIGNAL_BY_REASON;

interface UsePreventUserActionsOptions {
  enabled?: boolean;
  allowedDragAreaSelector?: string;
  allowedDragMimeType?: string;
  onSecurityViolation?: (event: SecurityViolationEvent) => Promise<void> | void;
}

const focusBlur = (
  handleBlur: (event: FocusEvent) => void,
  handleFocus: (event: FocusEvent) => void
) => {
  window.addEventListener("blur", handleBlur);
  window.addEventListener("focus", handleFocus);

  return () => {
    window.removeEventListener("blur", handleBlur);
    window.removeEventListener("focus", handleFocus);
  };
};

export function usePreventUserActions({
  enabled = true,
  allowedDragAreaSelector,
  allowedDragMimeType,
  onSecurityViolation,
}: UsePreventUserActionsOptions = {}) {
  const lastDevToolsViolationAt = useRef(0);
  const focusLossEpisode = useRef(false);

  const registerClipboardAttempt = useCallback(
    (action: ClipboardAction) => {
      onSecurityViolation?.({
        type: AssignmentAlertType.Clipboard,
        details: { clipboardAction: action }
      });
    },
    [onSecurityViolation]
  );

  const handleDevToolsDetected = useCallback(
    (reason: DevToolsDetectionReason) => {
      const now = Date.now();

      if (now - lastDevToolsViolationAt.current < 3000) {
        return;
      }

      lastDevToolsViolationAt.current = now;

      onSecurityViolation?.({
        type: AssignmentAlertType.DevTools,
        details: {
          devtoolsSignal: DEVTOOLS_SIGNAL_BY_REASON[reason]
        }
      });
    },
    [onSecurityViolation],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      if (focusLossEpisode.current) return;

      focusLossEpisode.current = true;
      onSecurityViolation?.({
        type: AssignmentAlertType.WindowFocusLoss,
      });
    };

    const handleFocus = () => {
      focusLossEpisode.current = false;
    };

    return focusBlur(handleBlur, handleFocus)
  }, [enabled, onSecurityViolation]);

  useContextMenuGuard({
    enabled,
    allowedDragAreaSelector,
    allowedDragMimeType
  });
  useClipboardGuard({ enabled, onClipboardAttempt: registerClipboardAttempt });
  useKeyboardShortcutGuard({
    enabled,
    onClipboardShortcut: registerClipboardAttempt,
    onDevToolsShortcut: () => handleDevToolsDetected(DEVTOOLS_SHORTCUT_REASON)
  });
  useDevToolsGuard({ enabled, onDetected: handleDevToolsDetected });
}
