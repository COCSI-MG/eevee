type Monaco = typeof import("monaco-editor");
type Model = import("monaco-editor").editor.ITextModel;
type Position = import("monaco-editor").Position;
type Entry = { label: string; kind?: string; detail?: string; doc?: string; parameters?: string[]; activeParameter?: number };
let worker: Worker | undefined;
let sequence = 0;
let retryAfter = 0;
const pending = new Map<number, { resolve(value: Entry[]): void; timer: ReturnType<typeof setTimeout> }>();
const models = new Set<Model>();
let providers: import("monaco-editor").IDisposable[] = [];
function stop() {
  worker?.terminate(); worker = undefined;
  for (const request of pending.values()) { clearTimeout(request.timer); request.resolve([]); }
  pending.clear();
}
async function query(model: Model, position: Position, kind: string): Promise<Entry[]> {
  if (Date.now() < retryAfter || !models.has(model) || model.isDisposed() || model.getValueLength() > 200000 || pending.size >= 20) return [];
  if (!worker) {
    try { worker = new window.Worker("/pyodide/314.0.7/semantic-worker.js", { type: "module", name: "eevee-python-semantic" }); } catch { return []; }
    worker.onerror = () => stop();
    worker.onmessage = ({ data }) => {
      if (data.bootstrapFailed) {
        retryAfter = Date.now() + 5000;
        stop();
        return;
      }
      const request = pending.get(data.id);
      if (!request) return;
      clearTimeout(request.timer); pending.delete(data.id);
      request.resolve(data.error ? [] : data.result);
    };
  }
  const version = model.getVersionId();
  const id = ++sequence;
  // Monaco uses UTF-16 offsets, Jedi uses Unicode code points.
  const column = Array.from(model.getLineContent(position.lineNumber).slice(0, position.column - 1)).length;
  const result = await new Promise<Entry[]>((resolve) => {
    const timer = setTimeout(() => stop(), 45000);
    pending.set(id, { resolve, timer });
    worker!.postMessage({ id, code: model.getValue(), line: position.lineNumber, column, kind });
  });
  return model.isDisposed() || model.getVersionId() !== version || !models.has(model) ? [] : result;
}
export function applyPythonSemantic(monaco: Monaco, nextModels: Model[]) {
  models.clear();
  nextModels.filter(m => m.getLanguageId() === "python").forEach(m => models.add(m));
  if (providers.length || !models.size) return;
  providers = [
    monaco.languages.registerCompletionItemProvider("python", {
      triggerCharacters: ["."],
      async provideCompletionItems(model, position) {
        const entries = await query(model, position, "complete");
        const word = model.getWordUntilPosition(position);
        return { suggestions: entries.map(entry => ({ label: entry.label, insertText: entry.label, detail: entry.detail,
          kind: entry.kind === "function" ? monaco.languages.CompletionItemKind.Method : monaco.languages.CompletionItemKind.Variable,
          range: { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn } })) };
      },
    }),
    monaco.languages.registerHoverProvider("python", {
      async provideHover(model, position) {
        const entries = await query(model, position, "hover");
        return entries.length ? { contents: entries.flatMap(entry => [{ value: entry.detail || entry.label }, { value: entry.doc || "" }]) } : null;
      },
    }),
    monaco.languages.registerSignatureHelpProvider("python", {
      signatureHelpTriggerCharacters: ["(", ","],
      async provideSignatureHelp(model, position) {
        const entries = await query(model, position, "signature");
        return entries.length ? { value: { signatures: entries.map(entry => ({ label: entry.label, parameters: (entry.parameters || []).map(label => ({ label })) })), activeSignature: 0, activeParameter: entries[0].activeParameter || 0 }, dispose() {} } : null;
      },
    }),
  ];
}
export function disposePythonSemantic() { stop(); providers.forEach(p => p.dispose()); providers = []; models.clear(); retryAfter = 0; }
