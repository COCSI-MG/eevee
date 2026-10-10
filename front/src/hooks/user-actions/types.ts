import type { ClipboardAction } from "@/constants/clipboard-action";
import type {
  AssignmentAlertDetails,
  AssignmentAlertType,
} from "@/app/interface/scheduler-api/assignment-alert";

export type { ClipboardAction } from "@/constants/clipboard-action";

export type SecurityViolationReason =
  | "devtools_console"
  | "devtools_debugger"
  | "devtools_performance"
  | "devtools_viewport";

export type RegisterClipboardAttempt = (action: ClipboardAction) => void;

export interface SecurityViolationEvent {
  type: AssignmentAlertType;
  details?: AssignmentAlertDetails;
  measuredCharactersPerSecond?: number;
}
