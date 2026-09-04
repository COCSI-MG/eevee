import { useCallback, useRef } from "react";
import { CLIPBOARD_ACTION } from "@/constants/clipboard-action";
import { ClipboardAction, RegisterClipboardAttempt } from "./types";

interface UseClipboardViolationTrackerOptions {
  violationLimit: number;
  onViolation?: (action: ClipboardAction, attempts: number) => void;
  onViolationLimit?: (action: ClipboardAction, attempts: number) => void;
}

interface LastClipboardAttempt {
  action: ClipboardAction;
  timestamp: number;
}

const DUPLICATE_ATTEMPT_WINDOW_MS = 250;

export function useClipboardViolationTracker({
  violationLimit,
  onViolation,
  onViolationLimit,
}: UseClipboardViolationTrackerOptions): RegisterClipboardAttempt {
  const attemptsRef = useRef(0);
  const lastAttemptRef = useRef<LastClipboardAttempt>({
    action: CLIPBOARD_ACTION.COPY,
    timestamp: 0,
  });

  return useCallback(
    (action: ClipboardAction) => {
      const now = Date.now();
      const lastAttempt = lastAttemptRef.current;
      const isDuplicateAttempt =
        lastAttempt?.action === action &&
        now - lastAttempt.timestamp < DUPLICATE_ATTEMPT_WINDOW_MS;

      if (isDuplicateAttempt) {
        return;
      }

      lastAttemptRef.current = { action, timestamp: now };
      attemptsRef.current += 1;

      onViolation?.(action, attemptsRef.current);

      if (attemptsRef.current >= violationLimit) {
        onViolationLimit?.(action, attemptsRef.current);
      }
    },
    [onViolation, onViolationLimit, violationLimit],
  );
}
