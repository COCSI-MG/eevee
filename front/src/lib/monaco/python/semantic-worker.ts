import type { PyodideInterface } from "pyodide";
const scope = globalThis as unknown as { postMessage(data: unknown): void; onmessage: ((event: MessageEvent) => void) | null };
const base = new URL("./", import.meta.url).href;
async function boot(): Promise<PyodideInterface> {
  const { loadPyodide } = await import(/* webpackIgnore: true */     `${base}pyodide.mjs`);
  const python: PyodideInterface = await loadPyodide({ indexURL: base });
  await python.loadPackage("jedi");
  const lockResponse = await fetch(new URL("python-assets.lock.json", base));
  if (!lockResponse.ok) throw new Error("Python asset lock unavailable");
  const lock = await lockResponse.json();
  const response = await fetch(new URL(lock.packages["pandas-stubs"].file, base));
  if (!response.ok) throw new Error("Pandas type definitions unavailable");
  python.unpackArchive(await response.arrayBuffer(), "zip", { extractDir: "/home/pyodide" });
  // Jedi resolves a stub-only package from its import name. This is the virtual
  // WASM filesystem, not a real pandas install or execution environment.
  python.runPython("import os; os.rename('/home/pyodide/pandas-stubs', '/home/pyodide/pandas')");
  const source = await fetch(new URL("semantic.py", base));
  if (!source.ok) throw new Error("Python semantic tools unavailable");
  python.runPython(await source.text());
  return python;
}
let ready: Promise<PyodideInterface> | undefined;
// Serialize requests: Pyodide globals belong to one interpreter.
let queue = Promise.resolve();
scope.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      let python: PyodideInterface;
      try { python = await (ready ??= boot()); }
      catch (error) {
        // The client disposes this partially initialized WASM worker and allows
        // a fresh one after a cooldown. Never cache a rejected boot forever.
        ready = undefined;
        scope.postMessage({ id: data.id, bootstrapFailed: true, error: String(error) });
        return;
      }
      python.globals.set("editor_code", data.code);
      python.globals.set("editor_line", data.line);
      python.globals.set("editor_column", data.column);
      python.globals.set("editor_kind", data.kind);
      try {
        const result = JSON.parse(python.runPython("semantic_query(editor_code, editor_line, editor_column, editor_kind)"));
        scope.postMessage({ id: data.id, result });
      } finally {
        for (const key of ["editor_code", "editor_line", "editor_column", "editor_kind"]) python.globals.delete(key);
      }
    } catch (error) { scope.postMessage({ id: data.id, error: String(error) }); }
  });
};
