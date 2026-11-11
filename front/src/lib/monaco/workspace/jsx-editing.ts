
import { emmetJSX } from "emmet-monaco-es";
import type { editor } from "monaco-editor";

type Monaco = typeof import("monaco-editor");
type Editor = editor.IStandaloneCodeEditor;
type Model = editor.ITextModel;

type JsxWorker = import("monaco-editor").languages.typescript.TypeScriptWorker & {
  getJsxHighlightSpans(fileName: string): Promise<JsxHighlightSpan[]>;
  getJsxClosingTag(fileName: string, offset: number): Promise<{ newText: string } | undefined>;
};

interface JsxHighlightSpan {
  line: number;
  character: number;
  length: number;
  type: number;
}

const configuredWorkers = new WeakSet<Monaco>();
const editors = new Set<Editor>();

let disposeEmmet: (() => void) | undefined;
let highlightProvider: import("monaco-editor").IDisposable | undefined;

export function configureJsxWorker(monaco: Monaco) {
  if (configuredWorkers.has(monaco)) return;

  const customWorkerPath = new URL("/monaco/jsx-worker.js", window.location.href).href;

  const { typescriptDefaults, javascriptDefaults } = monaco.languages.typescript;

  for (const defaults of [typescriptDefaults, javascriptDefaults]) {
    defaults.setWorkerOptions({
      ...defaults.workerOptions,
      customWorkerPath
    });
  }

  configuredWorkers.add(monaco);
}

function supportsJsx(instance: Editor): boolean {
  const filePath = instance.getModel()?.uri.path ?? "";

  const regexVerifyTsxJsx = /\.[jt]sx$/i

  return Boolean(editors.has(instance) && regexVerifyTsxJsx.test(filePath));
}

function canEditJsx(monaco: Monaco, instance: Editor): boolean {
  return (
    supportsJsx(instance) &&
    !instance.getOption(monaco.editor.EditorOption.readOnly)
  );
}

function findEditor(model: Model, predicate: (instance: Editor) => boolean): Editor | undefined {
  for (const instance of editors.keys()) {
    if (instance.getModel() === model && predicate(instance)) {
      return instance;
    }
  }

  return undefined;
}

async function getJsxWorker(monaco: Monaco, model: Model): Promise<JsxWorker> {
  configureJsxWorker(monaco);

  const typescript = monaco.languages.typescript;

  const getWorker = model.getLanguageId() === "javascript" ? typescript.getJavaScriptWorker : typescript.getTypeScriptWorker;

  const workerFactory = await getWorker();

  return (await workerFactory(model.uri)) as JsxWorker;
}

function createSemanticTokens(spans: JsxHighlightSpan[]): Uint32Array {
  const data: number[] = [];

  let previousLine = 0;
  let previousCharacter = 0;

  for (const span of spans) {
    const lineDelta = span.line - previousLine;

    const lineDeltaZero = lineDelta === 0;

    const characterDelta = lineDeltaZero ? (span.character - previousCharacter) : span.character;

    data.push(lineDelta, characterDelta, span.length, span.type, 0);

    previousLine = span.line;
    previousCharacter = span.character;
  }

  return new Uint32Array(data);
}

function registerJsxHighlighting(monaco: Monaco) {
  return monaco.languages.registerDocumentSemanticTokensProvider(
    [
      { language: "typescript", pattern: "**/*.tsx" },
      { language: "javascript", pattern: "**/*.jsx" }
    ],
    {
      getLegend: () => ({
        tokenTypes: ["jsxTag", "jsxComponent", "jsxAttribute"],
        tokenModifiers: []
      }),

      async provideDocumentSemanticTokens(model, _lastResultId, cancellation) {
        const owner = findEditor(model, supportsJsx);
        if (!owner) return null;

        const version = model.getVersionId();

        try {
          const worker = await getJsxWorker(monaco, model);
          const spans = await worker.getJsxHighlightSpans(model.uri.toString());

          const isOutdated =
            cancellation.isCancellationRequested ||
            model.isDisposed() ||
            model.getVersionId() !== version ||
            owner.getModel() !== model ||
            !supportsJsx(owner);

          if (isOutdated) return null;

          return { data: createSemanticTokens(spans) };
        } catch (error) {
          if (!cancellation.isCancellationRequested) {
            console.warn("JSX highlighting unavailable", error);
          }

          return null;
        }
      },

      releaseDocumentSemanticTokens() {},
    },
  );
}

function registerJsxEmmet(monaco: Monaco) {

  const scopedMonaco: Monaco = {
    ...monaco,
    languages: {
      ...monaco.languages,

      registerCompletionItemProvider(language, provider) {
        return monaco.languages.registerCompletionItemProvider(language, {
          ...provider,

          provideCompletionItems(model, ...args) {
            const owner = findEditor(
              model,
              instance => canEditJsx(monaco, instance)
            );

            if (!owner) return { suggestions: [] };

            return provider.provideCompletionItems(model, ...args);
          },
        });
      },
    },
  };

  return emmetJSX(scopedMonaco, ["javascript", "typescript"], {
    tokenizer: "standard"
  });
}

function registerAutoClosingTags(monaco: Monaco, instance: Editor) {
  let typedGreater = false;
  let disposed = false;

  async function insertClosingTag(model: Model, version: number) {

    await Promise.resolve();

    if (
      disposed ||
      instance.getModel() !== model ||
      model.getVersionId() !== version
    ) {
      return;
    }

    const position = instance.getPosition();
    if (!position) return;

    const worker = await getJsxWorker(monaco, model);
    const closingTag = await worker.getJsxClosingTag(model.uri.toString(), model.getOffsetAt(position));

    const canInsert =
      closingTag?.newText &&
      !disposed &&
      canEditJsx(monaco, instance) &&
      instance.getModel() === model &&
      model.getVersionId() === version &&
      instance.getSelections()?.length === 1 &&
      instance.getSelection()?.isEmpty() &&
      instance.getPosition()?.equals(position);

    if (!canInsert) return;

    instance.executeEdits(
      "jsx-close-tag",
      [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text: closingTag.newText
        }
      ],
      [
        new monaco.Selection(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        )
      ]
    );
  }

  const keydown = instance.onKeyDown(event => {
    typedGreater =
      event.browserEvent.key === ">" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;
  });

  const content = instance.onDidChangeModelContent(event => {
    const shouldClose =
      typedGreater &&
      !event.isFlush &&
      !event.isUndoing &&
      !event.isRedoing &&
      event.changes.length === 1 &&
      event.changes[0].text === ">";

    typedGreater = false;

    if (
      !shouldClose ||
      !canEditJsx(monaco, instance) ||
      instance.getSelections()?.length !== 1
    ) {
      return;
    }

    const model = instance.getModel();
    if (!model) return;

    void insertClosingTag(model, model.getVersionId()).catch(error => {
      if (!disposed) {
        console.warn("JSX tag completion unavailable", error);
      }
    });
  });

  return () => {
    if (disposed) return;

    disposed = true;
    keydown.dispose();
    content.dispose();
  };
}

export function registerJsxEditing(monaco: Monaco, instance: Editor) {
  editors.add(instance);

  highlightProvider ??= registerJsxHighlighting(monaco);
  disposeEmmet ??= registerJsxEmmet(monaco);

  const disposeAutoClosing = registerAutoClosingTags(monaco, instance);

  let disposed = false;

  return () => {
    if (disposed) return;
    disposed = true;

    disposeAutoClosing();
    editors.delete(instance);

    if (editors.size > 0) return;

    disposeEmmet?.();
    highlightProvider?.dispose();

    disposeEmmet = undefined;
    highlightProvider = undefined;
  };
}
