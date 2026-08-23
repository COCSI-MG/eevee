import { WorkerType } from "@/app/interface/scheduler-api/worker";
import WORKER_SOURCE_MAP from "./worker-source-map.json";

export interface WorkerLanguageConfig {
  /** Monaco language id, e.g. "typescript" | "javascript" | "python". */
  editorLanguage: string;
  /** File extension including the dot, e.g. ".ts" | ".py". */
  fileExtension: string;
  /** Default file base name, e.g. "app" (produces app.ts / app.py). */
  defaultFileName: string;
}

export type MonacoCompilerPreset =
  | "node"
  | "nest"
  | "grpc"
  | "next"
  | "react";

/**
 * Controls which workspace files can be suggested in JavaScript/TypeScript
 * imports.
 *
 * - `script`: script and JSON files.
 * - `web`: script, JSON and CSS files.
 * - `none`: custom workspace import suggestions are disabled.
 */
export type ImportCompletionPolicy = "script" | "web" | "none";

export interface WorkerEditorConfig extends WorkerLanguageConfig {
  /** Compiler option preset applied to TypeScript/JavaScript models. */
  compilerPreset: MonacoCompilerPreset | null;
  /** File categories exposed by the workspace import completion provider. */
  importCompletionPolicy: ImportCompletionPolicy;
}

const WORKER_EDITOR_CONFIG_REGISTRY: Record<WorkerType, WorkerEditorConfig> = {
  [WorkerType.NODE_DEFAULT]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
    compilerPreset: "node",
    importCompletionPolicy: "script",
  },
  [WorkerType.JAVASCRIPT_DEFAULT]: {
    editorLanguage: "javascript",
    fileExtension: ".js",
    defaultFileName: "app",
    compilerPreset: "node",
    importCompletionPolicy: "script",
  },
  [WorkerType.NODE_NESTJS]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
    compilerPreset: "nest",
    importCompletionPolicy: "script",
  },
  [WorkerType.NODE_GRPCJS]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
    compilerPreset: "grpc",
    importCompletionPolicy: "script",
  },
  [WorkerType.NODE_NEXTJS_CYPRESS]: {
    editorLanguage: "typescript",
    fileExtension: ".tsx",
    defaultFileName: "page",
    compilerPreset: "next",
    importCompletionPolicy: "web",
  },
  [WorkerType.NODE_REACTJS_CYPRESS]: {
    editorLanguage: "typescript",
    fileExtension: ".tsx",
    defaultFileName: "App",
    compilerPreset: "react",
    importCompletionPolicy: "web",
  },
  [WorkerType.NODE_DEFAULT_POSTGRESQL]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
    compilerPreset: "node",
    importCompletionPolicy: "script",
  },
  [WorkerType.NODE_NESTJS_POSTGRESQL]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
    compilerPreset: "nest",
    importCompletionPolicy: "script",
  },
  [WorkerType.NODE_TERAORM]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
    compilerPreset: "node",
    importCompletionPolicy: "script",
  },
  [WorkerType.PYTHON_DEFAULT]: {
    editorLanguage: "python",
    fileExtension: ".py",
    defaultFileName: "app",
    compilerPreset: null,
    importCompletionPolicy: "none",
  },
};

const FALLBACK_LANGUAGE_CONFIG: WorkerLanguageConfig = {
  editorLanguage: "typescript",
  fileExtension: ".ts",
  defaultFileName: "app",
};

const workerSourceMap = WORKER_SOURCE_MAP as Record<string, string>;

export function findWorkerEditorConfig(
  workerType?: WorkerType | string,
): WorkerEditorConfig | undefined {
  if (!workerType) return undefined;
  return WORKER_EDITOR_CONFIG_REGISTRY[workerType as WorkerType];
}

export function getWorkerLanguageConfig(
  workerType?: WorkerType | string,
): WorkerLanguageConfig {
  return findWorkerEditorConfig(workerType) ?? FALLBACK_LANGUAGE_CONFIG;
}

export function getWorkerTypePackDir(
  workerType?: WorkerType | string,
): string | undefined {
  if (!workerType) return undefined;
  return workerSourceMap[workerType];
}
