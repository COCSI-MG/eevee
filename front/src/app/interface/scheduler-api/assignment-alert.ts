export enum AssignmentAlertType {
  WindowFocusLoss = "window_focus_loss",
  DevTools = "devtools",
  Clipboard = "clipboard",
  TypingRate = "typing_rate",
  LegacySuspension = "legacy_suspension",
}

export const CONFIGURABLE_ASSIGNMENT_ALERT_TYPES = [
  AssignmentAlertType.WindowFocusLoss,
  AssignmentAlertType.DevTools,
  AssignmentAlertType.Clipboard,
  AssignmentAlertType.TypingRate,
] as const;

export interface AssignmentAlertPolicy {
  suspensionAlertLimit: number;
  typingCharactersPerSecondLimit: number;
  punitiveTypes: AssignmentAlertType[];
  version?: number;
}

export interface AssignmentAlertStatus {
  activeCount: number;
  limit: number;
  suspended: boolean;
}

export interface AssignmentAlertDetails {
  clipboardAction?: "copy" | "cut" | "paste";
  devtoolsSignal?:
    | "shortcut"
    | "console"
    | "debugger"
    | "performance"
    | "viewport";
  measuredCharactersPerSecond?: number;
  legacyReason?: string;
}

export interface AssignmentUserAlert {
  id: number;
  eventId: string;
  assignmentId: number;
  userId: number;
  type: AssignmentAlertType;
  details?: AssignmentAlertDetails | null;
  occurredAt?: string | null;
  createdAt: string;
  deletedAt?: string | null;
  archivedByUserId?: number | null;
}

export interface RecordAssignmentAlertRequest {
  eventId: string;
  type: AssignmentAlertType;
  occurredAt: string;
  details?: AssignmentAlertDetails;
  measuredCharactersPerSecond?: number;
}

export interface RecordAssignmentAlertResponse extends AssignmentAlertStatus {
  recorded: boolean;
  duplicate: boolean;
}

export interface ArchiveAssignmentAlertResponse extends AssignmentAlertStatus {
  alertId: number;
  archivedAt: string;
}

export interface AssignmentAlertUserSummary extends AssignmentAlertStatus {
  userId: number;
  name: string;
  email: string;
  totalCount: number;
  lastAlertAt: string;
}
