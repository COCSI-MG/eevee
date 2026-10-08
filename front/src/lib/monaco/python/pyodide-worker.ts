import type { PyodideInterface } from "pyodide";
import type { CheckRequest, WorkerResponse } from "./protocol";

// Transpiled to a static module worker by copy-pyodide-assets.mjs. Keeping the
// runtime outside Next's bundle avoids rewriting WASM/import.meta.url paths.
const scope = globalThis as unknown as {
  postMessage(message: WorkerResponse): void;
  onmessage: ((event: MessageEvent<CheckRequest>) => void) | null;
};
const base = new URL("./", import.meta.url).href;
const get = async (file: string) => {
  const response = await fetch(new URL(file, base), { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Python asset ${file}: HTTP ${response.status}`);
  return response;
};

async function boot(): Promise<PyodideInterface> {
  const { loadPyodide } = await import(/* webpackIgnore: true */ `${base}pyodide.mjs`);
  const python: PyodideInterface = await loadPyodide({ indexURL: base });
  python.runPython(await (await get("checker.py")).text());
  scope.postMessage({ type: "ready" });
  // Syntax is usable before this optional download completes or fails.
  void loadLint(python);
  return python;
}

async function loadLint(python: PyodideInterface): Promise<void> {
  try {
    const wheel = await get("pyflakes-3.4.0-py2.py3-none-any.whl");
    python.unpackArchive(await wheel.arrayBuffer(), "zip", { extractDir: "/home/pyodide" });
    python.runPython("from pyflakes.checker import Checker");
    scope.postMessage({ type: "lint-ready" });
  } catch (error) {
    console.warn("Python lint failed to load; retaining syntax checks", error);
  }
}

const ready = boot();
void ready.catch((error) => scope.postMessage({ type: "error", message: String(error) }));
scope.onmessage = async ({ data }) => {
  if (data.type !== "check") return;
  try {
    const python = await ready;
    python.globals.set("student_source", data.code);
    try {
      const diagnostics = JSON.parse(python.runPython("check_source(student_source)"));
      scope.postMessage({ type: "result", requestId: data.requestId, diagnostics });
    } finally {
      python.globals.delete("student_source");
    }
  } catch (error) {
    scope.postMessage({ type: "error", message: String(error) });
  }
};
