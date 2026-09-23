import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { FileNode } from "@/types/shared";
import { applyLanguageDefaults } from "../intellisense/compiler";
import { applyTypePack, clearTypePacks } from "../intellisense/type-packs";
import { resolveMonacoLanguage } from "../language";
import { findWorkerEditorConfig } from "../worker-editor-config";
import { applyPythonIntellisense, disposePythonIntellisense } from "../python/pyodide-client";
import {
  getImportPathSuggestions,
  normalizeWorkspacePath,
} from "./import-paths";
import { disposeWorkspaceModels, syncWorkspaceModels, workspaceModelPath } from "./models";

type MonacoNamespace = typeof import("monaco-editor");
type Disposable = import("monaco-editor").IDisposable;
type TextModel = import("monaco-editor").editor.ITextModel;
type Position = import("monaco-editor").Position;

interface WorkspaceRuntimeConfig {
  tree: FileNode;
  activePath: string;
  workerType?: WorkerType | string;
}

interface WorkspaceRegistration extends WorkspaceRuntimeConfig {
  monaco: MonacoNamespace;
}

const registrations = new Map<symbol, WorkspaceRegistration>();
let completionDisposables: Disposable[] = [];
let appliedWorkerType: string | undefined;

function collectFilePaths(node: FileNode | null): string[] {
  if (!node) return [];
  if (node.isFile) return [normalizeWorkspacePath(node.path)];
  return node.children?.flatMap(collectFilePaths) ?? [];
}

function registrationForModel(model: TextModel): WorkspaceRegistration | null {
  const modelPath = normalizeWorkspacePath(model.uri.path);

  const candidates = Array.from(registrations.values()).reverse();

  for (const registration of candidates) {
    if (collectFilePaths(registration.tree).includes(modelPath)) {
      return registration;
    }
  }
  return null;
}

function provideImportCompletions(
  monaco: MonacoNamespace,
  model: TextModel,
  position: Position,
) {
  const registration = registrationForModel(model);

  if (!registration) return { suggestions: [] };

  const lineUntilCursor = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1);

  const match = lineUntilCursor.match(/(import\s+.*?from\s+|export\s+.*?from\s+|import\s*)['"]([^'"\n]*)$/);

  if (!match) return { suggestions: [] };

  const policy = findWorkerEditorConfig(registration.workerType)?.importCompletionPolicy ?? "none";

  const typedValue = match[2] ?? "";

  const suggestions = getImportPathSuggestions(model.uri.path, collectFilePaths(registration.tree), policy, typedValue);

  const range = new monaco.Range(
    position.lineNumber,
    position.column - typedValue.length,
    position.lineNumber,
    position.column,
  );

  return {
    suggestions: suggestions.map((suggestion) => ({
      label: suggestion,
      kind: monaco.languages.CompletionItemKind.File,
      insertText: suggestion,
      range,
    })),
  };
}

function ensureCompletionProviders(monaco: MonacoNamespace): void {
  if (completionDisposables.length > 0) return;

  const provideCompletionItems = (model: TextModel, position: Position) => provideImportCompletions(monaco, model, position);

  completionDisposables = ["typescript", "javascript"].map((language) =>
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ["'", '"', "/", "."],
      provideCompletionItems,
    }),
  );
}

function latestRegistration(): WorkspaceRegistration | undefined {
  return Array.from(registrations.values()).at(-1);
}

function refreshRuntime(): void {
  const latest = latestRegistration();
  if (!latest) return;

  const activePaths = Array.from(
    registrations.values(),
    ({ activePath }) => activePath,
  ).filter(Boolean);

  syncWorkspaceModels(latest.monaco, latest.tree, activePaths);

  // Run before the worker-type early return: files change within a workspace.
  if (findWorkerEditorConfig(latest.workerType)?.pythonIntellisense) {
    const paths = new Set(collectFilePaths(latest.tree).map(
      (path) => latest.monaco.Uri.parse(workspaceModelPath(path)).toString(),
    ));
    applyPythonIntellisense(latest.monaco, latest.monaco.editor.getModels().filter(
      (model) => paths.has(model.uri.toString()),
    ));
  } else {
    disposePythonIntellisense();
  }

  const nextWorkerType = latest.workerType?.toString();
  if (nextWorkerType === appliedWorkerType) return;
  appliedWorkerType = nextWorkerType;

  const workerLanguage = resolveMonacoLanguage({
    workerType: latest.workerType,
  });
  if (workerLanguage === "typescript" || workerLanguage === "javascript") {
    applyLanguageDefaults(latest.monaco, latest.workerType);
  }
  void applyTypePack(latest.monaco, latest.workerType);
}

export function registerWorkspaceRuntime(
  monaco: MonacoNamespace,
  initialConfig: WorkspaceRuntimeConfig,
) {
  const id = Symbol("workspace-editor");

  registrations.set(id, { monaco, ...initialConfig });

  ensureCompletionProviders(monaco);
  refreshRuntime();

  return {
    update(config: WorkspaceRuntimeConfig) {
      if (!registrations.has(id)) return;
      registrations.delete(id);
      registrations.set(id, { monaco, ...config });
      refreshRuntime();
    },
    dispose() {
      registrations.delete(id);

      if (registrations.size > 0) {
        refreshRuntime();
        return;
      }

      completionDisposables.forEach((disposable) => disposable.dispose());
      completionDisposables = [];
      disposePythonIntellisense();
      disposeWorkspaceModels(monaco);
      clearTypePacks(monaco);
      appliedWorkerType = undefined;
    },
  };
}
