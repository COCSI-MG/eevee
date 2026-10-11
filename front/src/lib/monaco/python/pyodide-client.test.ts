import { applyPythonIntellisense, disposePythonIntellisense } from "./pyodide-client";
import { toast } from "@/hooks/use-toast";

jest.mock("@/hooks/use-toast", () => ({ toast: jest.fn(() => ({ dismiss: jest.fn() })) }));
type Monaco = typeof import("monaco-editor");
type Model = import("monaco-editor").editor.ITextModel;

class FakeWorker {
  static instances: FakeWorker[] = [];
  postMessage = jest.fn();
  terminate = jest.fn();
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: unknown) => void;
  constructor() { FakeWorker.instances.push(this); }
  emit(data: unknown) { this.onmessage?.({ data }); }
}

function createModel() {
  let version = 1;
  let disposed = false;
  const changes = new Set<() => void>();
  const disposals = new Set<() => void>();
  const subscribe = (set: Set<() => void>, fn: () => void) => {
    set.add(fn);
    return { dispose: () => set.delete(fn) };
  };
  const model = {
    isDisposed: () => disposed,
    getVersionId: () => version,
    getValue: () => `print(${version})`,
    getLanguageId: () => "python",
    getLineCount: () => 1,
    getLineMaxColumn: () => 20,
    onDidChangeContent: (fn: () => void) => subscribe(changes, fn),
    onWillDispose: (fn: () => void) => subscribe(disposals, fn),
  } as unknown as Model;
  return {
    model,
    edit: () => { version++; changes.forEach((fn) => fn()); },
    dispose: () => { disposals.forEach((fn) => fn()); disposed = true; },
    changes,
  };
}

describe("Python worker lifecycle", () => {
  const markers = jest.fn();
  const monaco = { editor: { setModelMarkers: markers } } as unknown as Monaco;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    FakeWorker.instances = [];
    global.Worker = FakeWorker as unknown as typeof Worker;
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => { disposePythonIntellisense(); jest.useRealTimers(); jest.restoreAllMocks(); });

  it("is lazy, shares one worker and bounds the queue to one request per model", () => {
    applyPythonIntellisense(monaco, []);
    expect(FakeWorker.instances).toHaveLength(0);
    const first = createModel();
    const second = createModel();
    applyPythonIntellisense(monaco, [first.model, second.model]);
    applyPythonIntellisense(monaco, [first.model, second.model]);
    expect(FakeWorker.instances).toHaveLength(1);
    const worker = FakeWorker.instances[0];
    expect(worker.postMessage).not.toHaveBeenCalled();
    worker.emit({ type: "ready", lintAvailable: true });
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    const { requestId } = worker.postMessage.mock.calls[0][0];
    worker.emit({ type: "result", requestId, diagnostics: [] });
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
  });

  it("debounces typing and rejects results for an older model version", () => {
    const file = createModel();
    applyPythonIntellisense(monaco, [file.model]);
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "ready", lintAvailable: true });
    const { requestId } = worker.postMessage.mock.calls[0][0];
    for (let i = 0; i < 20; i++) { file.edit(); jest.advanceTimersByTime(50); }
    markers.mockClear();
    worker.emit({ type: "result", requestId, diagnostics: [] });
    expect(markers).not.toHaveBeenCalled();
    jest.advanceTimersByTime(349);
    expect(worker.postMessage).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
    expect(worker.postMessage.mock.calls[1][0].code).toBe("print(21)");
  });

  it("clears removed models and terminates on disposal without leaking callbacks", () => {
    const file = createModel();
    applyPythonIntellisense(monaco, [file.model]);
    const worker = FakeWorker.instances[0];
    file.edit();
    file.dispose();
    expect(file.changes.size).toBe(0);
    disposePythonIntellisense();
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(50000);
    expect(worker.postMessage).not.toHaveBeenCalled();
    applyPythonIntellisense(monaco, [createModel().model]);
    expect(FakeWorker.instances).toHaveLength(2);
    worker.emit({ type: "ready", lintAvailable: true });
    expect(FakeWorker.instances[1].postMessage).not.toHaveBeenCalled();
  });

  it("times out boot, dismisses loading, and avoids repeated retries on edits", () => {
    const file = createModel();
    applyPythonIntellisense(monaco, [file.model]);
    jest.advanceTimersByTime(45000);
    expect(FakeWorker.instances[0].terminate).toHaveBeenCalledTimes(1);
    expect(jest.mocked(toast).mock.results[0].value.dismiss).toHaveBeenCalled();
    file.edit();
    applyPythonIntellisense(monaco, [file.model]);
    jest.advanceTimersByTime(1000);
    expect(FakeWorker.instances).toHaveLength(1);
    expect(FakeWorker.instances[0].postMessage).not.toHaveBeenCalled();
  });

  it("terminates a stuck analysis and clears previously shown diagnostics", () => {
    applyPythonIntellisense(monaco, [createModel().model]);
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "ready", lintAvailable: true });
    jest.advanceTimersByTime(10000);
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(markers).toHaveBeenLastCalledWith(expect.anything(), "python-syntax", []);
  });

  it("checks syntax before optional lint is ready, then refreshes warnings", () => {
    applyPythonIntellisense(monaco, [createModel().model]);
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "ready" });
    const { requestId } = worker.postMessage.mock.calls[0][0];
    worker.emit({ type: "result", requestId, diagnostics: [] });
    worker.emit({ type: "lint-ready" });
    expect(worker.postMessage).toHaveBeenCalledTimes(2);
  });

  it("handles worker boot errors without leaving a loading notification", () => {
    applyPythonIntellisense(monaco, [createModel().model]);
    const worker = FakeWorker.instances[0];
    worker.emit({ type: "error", message: "offline" });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect(jest.mocked(toast).mock.results[0].value.dismiss).toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
