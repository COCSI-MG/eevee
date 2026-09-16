export enum AssignmentAlertType {
  WINDOW_FOCUS_LOSS = 'window_focus_loss',
  DEVTOOLS = 'devtools',
  CLIPBOARD = 'clipboard',
  TYPING_RATE = 'typing_rate',
  LEGACY_SUSPENSION = 'legacy_suspension',
}

export const CONFIGURABLE_ASSIGNMENT_ALERT_TYPES = [
  AssignmentAlertType.WINDOW_FOCUS_LOSS,
  AssignmentAlertType.DEVTOOLS,
  AssignmentAlertType.CLIPBOARD,
  AssignmentAlertType.TYPING_RATE,
] as const;

export type ConfigurableAssignmentAlertType = (typeof CONFIGURABLE_ASSIGNMENT_ALERT_TYPES)[number];
