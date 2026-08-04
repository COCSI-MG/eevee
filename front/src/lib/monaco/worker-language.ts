import { WorkerType } from "@/app/interface/scheduler-api/worker";

export interface WorkerLanguageConfig {
  /** Monaco language id, e.g. "typescript" | "python" | "go" | "java". */
  editorLanguage: string;
  /** File extension including the dot, e.g. ".ts" | ".py". */
  fileExtension: string;
  /** Default file base name, e.g. "app" (produces app.ts / app.py). */
  defaultFileName: string;
}

export const WORKER_LANGUAGE_MAP: Partial<
  Record<WorkerType, WorkerLanguageConfig>
> = {
  [WorkerType.NODE_DEFAULT]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
  },
  [WorkerType.NODE_NESTJS]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
  },
  [WorkerType.NODE_GRPCJS]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
  },
  [WorkerType.NODE_NEXTJS_CYPRESS]: {
    editorLanguage: "typescript",
    fileExtension: ".tsx",
    defaultFileName: "page",
  },
  [WorkerType.NODE_REACTJS_CYPRESS]: {
    editorLanguage: "typescript",
    fileExtension: ".tsx",
    defaultFileName: "App",
  },
  [WorkerType.NODE_DEFAULT_POSTGRESQL]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
  },
  [WorkerType.NODE_NESTJS_POSTGRESQL]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
  },
  [WorkerType.NODE_TERAORM]: {
    editorLanguage: "typescript",
    fileExtension: ".ts",
    defaultFileName: "app",
  },
  [WorkerType.PYTHON_DEFAULT]: {
    editorLanguage: "python",
    fileExtension: ".py",
    defaultFileName: "app",
  },
};

const FALLBACK: WorkerLanguageConfig = {
  editorLanguage: "typescript",
  fileExtension: ".ts",
  defaultFileName: "app",
};

export function getWorkerLanguageConfig(
  workerType?: WorkerType | string,
): WorkerLanguageConfig {
  return WORKER_LANGUAGE_MAP[workerType as WorkerType] ?? FALLBACK;
}
