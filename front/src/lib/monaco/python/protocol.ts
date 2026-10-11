export interface PythonDiagnostic {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  message: string;
  severity: "error" | "warning";
}

export interface CheckRequest {
  type: "check";
  requestId: number;
  code: string;
}

export type WorkerResponse =
  | { type: "ready" }
  | { type: "lint-ready" }
  | { type: "result"; requestId: number; diagnostics: PythonDiagnostic[] }
  | { type: "error"; message: string };
