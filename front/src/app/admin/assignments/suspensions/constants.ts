import { AssignmentAlertType } from "@/app/interface/scheduler-api/assignment-alert";

export const HISTORY_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived"
} as const;

export type HistoryStatus = (typeof HISTORY_STATUS)[keyof typeof HISTORY_STATUS];

export const ALERT_LABELS: Record<AssignmentAlertType, string> = {
  [AssignmentAlertType.WindowFocusLoss]: "Saída da tela",
  [AssignmentAlertType.DevTools]: "DevTools",
  [AssignmentAlertType.Clipboard]: "Copiar/colar",
  [AssignmentAlertType.TypingRate]: "Velocidade de digitação",
  [AssignmentAlertType.LegacySuspension]: "Suspensão anterior"
};

export const CLIPBOARD_ACTION_LABELS = {
  copy: "Tentativa de copiar",
  cut: "Tentativa de recortar",
  paste: "Tentativa de colar"
} as const;

export const DEVTOOLS_SIGNAL_LABELS = {
  shortcut: "Atalho das ferramentas de desenvolvedor detectado",
  console: "Console das ferramentas de desenvolvedor detectado",
  debugger: "Depurador detectado",
  performance: "Análise de desempenho detectada",
  viewport: "Alteração suspeita da área visível detectada"
} as const;
