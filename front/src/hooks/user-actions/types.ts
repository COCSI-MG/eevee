import type { ClipboardAction } from "@/constants/clipboard-action";

export type { ClipboardAction } from "@/constants/clipboard-action";

export type SecurityViolationReason =
  | "clipboard_attempt_limit"
  | "devtools_console"
  | "devtools_debugger"
  | "devtools_performance"
  | "devtools_viewport";

export type RegisterClipboardAttempt = (action: ClipboardAction) => void;
