import type { editor } from "monaco-editor";
import type { PythonDiagnostic } from "./protocol";

export const PYTHON_MARKER_OWNER = "python-syntax";

export function buildPythonMarkers(
  model: Pick<editor.ITextModel, "getLineCount" | "getLineMaxColumn">,
  diagnostics: PythonDiagnostic[],
): editor.IMarkerData[] {
  const line = (value: number) => Math.max(1, Math.min(model.getLineCount(), value));
  const column = (row: number, value: number) => Math.max(1, Math.min(model.getLineMaxColumn(row), value));
  return diagnostics.map((diagnostic) => {
    const startLineNumber = line(diagnostic.line);
    const startColumn = column(startLineNumber, diagnostic.column);
    const endLineNumber = Math.max(startLineNumber, line(diagnostic.endLine));
    const endColumn = column(endLineNumber, Math.max(
      endLineNumber === startLineNumber ? startColumn + 1 : 1,
      diagnostic.endColumn,
    ));
    return {
      startLineNumber, startColumn, endLineNumber, endColumn,
      message: diagnostic.message,
      severity: diagnostic.severity === "error" ? 8 : 4,
      source: diagnostic.severity === "error" ? "Python" : "Pyflakes",
    };
  });
}
