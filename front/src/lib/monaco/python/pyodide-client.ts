import { toast } from "@/hooks/use-toast";
import { buildPythonMarkers, PYTHON_MARKER_OWNER } from "./markers";
import type { WorkerResponse } from "./protocol";

type Monaco = typeof import("monaco-editor");
type Model = import("monaco-editor").editor.ITextModel;
type Disposable = import("monaco-editor").IDisposable;
interface WatchedModel {
  monaco: Monaco;
  subscriptions: Disposable[];
  timer?: ReturnType<typeof setTimeout>;
}
const watched = new Map<Model, WatchedModel>();
const queued = new Set<Model>();
let worker: Worker | undefined;
let ready = false;
let failed = false;
let sequence = 0;
let inFlight: { model: Model; version: number; requestId: number } | undefined;
let watchdog: ReturnType<typeof setTimeout> | undefined;
let loading: ReturnType<typeof toast> | undefined;

function clearWatchdog() {
  clearTimeout(watchdog);
  watchdog = undefined;
}

function stopWorker() {
  worker?.terminate();
  worker = undefined;
  ready = false;
  inFlight = undefined;
  clearWatchdog();
  loading?.dismiss();
  loading = undefined;
}

function fail(error: unknown) {
  console.warn("Python editor tools unavailable", error);
  failed = true;
  stopWorker();
  queued.clear();
  for (const [model, entry] of watched) {
    clearTimeout(entry.timer);
    if (!model.isDisposed()) entry.monaco.editor.setModelMarkers(model, PYTHON_MARKER_OWNER, []);
  }
}

function drain() {
  if (!worker || !ready || inFlight || failed) return;
  const model = queued.values().next().value as Model | undefined;
  if (!model) return;
  queued.delete(model);
  if (model.isDisposed() || !watched.has(model)) { drain(); return; }
  inFlight = { model, version: model.getVersionId(), requestId: ++sequence };
  watchdog = setTimeout(() => fail("Python analysis timed out"), 10000);
  try {
    worker.postMessage({ type: "check", requestId: sequence, code: model.getValue() });
  } catch (error) { fail(error); }
}

function ensureWorker() {
  if (worker || failed) return;
  loading = toast({ title: "Preparando ferramentas Python…", duration: Infinity });
  try {
    // This worker is prepared in public/ before dev/build. Use the browser
    // constructor explicitly so Turbopack does not treat it as a bundled entry.
    worker = new window.Worker("/pyodide/314.0.7/worker.js", { type: "module", name: "eevee-python" });
    const current = worker;
    watchdog = setTimeout(() => fail("Python tools took too long to load"), 45000);
    worker.onerror = (event) => {
      event.preventDefault();
      if (worker === current) fail(event.message);
    };
    worker.onmessageerror = () => { if (worker === current) fail("Invalid worker response"); };
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (worker !== current) return;
      if (data.type === "error") { fail(data.message); return; }
      if (data.type === "lint-ready") {
        for (const [model, entry] of watched) if (!entry.timer) queued.add(model);
        drain();
        return;
      }
      if (data.type === "ready") {
        clearWatchdog();
        ready = true;
        loading?.dismiss();
        loading = undefined;
        drain();
        return;
      }
      if (!inFlight || data.requestId !== inFlight.requestId) return;
      clearWatchdog();
      const { model, version } = inFlight;
      inFlight = undefined;
      const entry = watched.get(model);
      if (entry && !model.isDisposed() && model.getVersionId() === version) {
        entry.monaco.editor.setModelMarkers(model, PYTHON_MARKER_OWNER, buildPythonMarkers(model, data.diagnostics));
      }
      drain();
    };
  } catch (error) { fail(error); }
}

function unwatch(model: Model) {
  const entry = watched.get(model);
  if (!entry) return;
  watched.delete(model);
  queued.delete(model);
  clearTimeout(entry.timer);
  entry.subscriptions.forEach((subscription) => subscription.dispose());
  if (!model.isDisposed()) entry.monaco.editor.setModelMarkers(model, PYTHON_MARKER_OWNER, []);
}

/** Synchronize only models belonging to the current Python workspace. */
export function applyPythonIntellisense(monaco: Monaco, models: Model[]) {
  const desired = new Set(models.filter((model) => !model.isDisposed() && model.getLanguageId() === "python"));
  for (const model of watched.keys()) if (!desired.has(model)) unwatch(model);
  for (const model of desired) {
    if (watched.has(model)) continue;
    const entry: WatchedModel = { monaco, subscriptions: [] };
    watched.set(model, entry);
    entry.subscriptions.push(model.onDidChangeContent(() => {
      clearTimeout(entry.timer);
      queued.delete(model);
      monaco.editor.setModelMarkers(model, PYTHON_MARKER_OWNER, []);
      if (failed) return;
      entry.timer = setTimeout(() => { entry.timer = undefined; queued.add(model); drain(); }, 400);
    }), model.onWillDispose(() => unwatch(model)));
    if (!failed) queued.add(model);
  }
  if (desired.size) { ensureWorker(); drain(); }
}

export function disposePythonIntellisense() {
  stopWorker();
  for (const model of watched.keys()) unwatch(model);
  queued.clear();
  failed = false;
}
