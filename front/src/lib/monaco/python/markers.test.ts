import { buildPythonMarkers } from "./markers";

describe("Python markers", () => {
  const model = { getLineCount: () => 3, getLineMaxColumn: () => 10 };
  it("maps syntax errors and lint to Monaco severities", () => {
    const markers = buildPythonMarkers(model, [
      { line: 2, column: 1, endLine: 2, endColumn: 4, message: "expected ':'", severity: "error" },
      { line: 3, column: 2, endLine: 3, endColumn: 3, message: "undefined name 'x'", severity: "warning" },
    ]);
    expect(markers[0]).toMatchObject({ startLineNumber: 2, startColumn: 1, endColumn: 4, severity: 8 });
    expect(markers[1]).toMatchObject({ severity: 4, source: "Pyflakes" });
  });
  it("clamps missing, backwards and EOF ranges to the model", () => {
    expect(buildPythonMarkers(model, [
      { line: 4, column: 20, endLine: 1, endColumn: -1, message: "EOF", severity: "error" },
    ])[0]).toMatchObject({ startLineNumber: 3, endLineNumber: 3, startColumn: 10, endColumn: 10 });
  });
});
