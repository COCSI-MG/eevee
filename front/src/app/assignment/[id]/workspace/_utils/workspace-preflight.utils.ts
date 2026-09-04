import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { SchedulingFiles } from "@/app/interface/scheduler-api/scheduling";
import {
  DEFAULT_WORKSPACE_PREFLIGHT_RESPONSE,
  ESM_MAIN_EXPORT_PATTERNS,
  FailureTypeWorker,
  FORMAT_WORKSPACE_DIAGNOSTIC,
  JAVASCRIPT_ENTRY_FILE_PATHS,
  MAIN_EXPORT_PATTERNS,
  MAX_TRANSPILE_ERRORS,
  NEXT_ENTRY_FILE_PATHS,
  NODE_ENTRY_FILE_PATHS,
  PYTHON_ENTRY_FILE_PATHS,
  PYTHON_MAIN_PATTERN,
  REACT_COMPONENT_FILE_PATHS,
  REACT_ENTRY_FILE_PATHS,
  SOURCE_CODE_EXTENSION_REGEX,
  SOURCE_DIRECTORY_PREFIX,
  SUPPORTED_WORKERS,
  TYPESCRIPT_FILE_EXTENSION,
  TYPESCRIPT_SOURCE_EXTENSION_REGEX,
  WORKSPACE_PREFLIGHT_FAILURE_RESPONSES,
  WORKSPACE_PREFLIGHT_LOG_ERROR,
  WORKSPACE_PREFLIGHT_RESPONSES,
} from "./constant";

export interface WorkspacePreflightResult {
  ok: boolean;
  message?: string;
  details?: string[];
}

interface RunWorkspacePreflightParams {
  workerType?: string;
  files?: SchedulingFiles;
}

function normalizeWorkerType(workerType?: string): WorkerType | null {
  if (!workerType) {
    return null;
  }

  if (!SUPPORTED_WORKERS.has(workerType as WorkerType)) {
    return null;
  }

  return workerType as WorkerType;
}

function hasAnyFile(files: SchedulingFiles, paths: readonly string[]): boolean {
  return paths.some((path) => typeof files[path] === "string");
}

function hasMainExport(content: string): boolean {
  return MAIN_EXPORT_PATTERNS.some((pattern) => pattern.test(content));
}

function hasPythonMain(content: string): boolean {
  return PYTHON_MAIN_PATTERN.test(content);
}

function hasEsmMainExport(content: string): boolean {
  return ESM_MAIN_EXPORT_PATTERNS.some((pattern) => pattern.test(content));
}

function formatDiagnostics(
  filePath: string,
  content: string,
  diagnostics: Array<{
    messageText: string | { messageText: string };
    start?: number;
  }>,
): string[] {
  const lines = content.split("\n");

  return diagnostics.map((diagnostic) => {
    const start = diagnostic.start ?? 0;

    let line = 1;
    let column = 1;
    let walked = 0;

    for (let idx = 0; idx < lines.length; idx += 1) {
      const lineLength = lines[idx].length + 1;
      if (walked + lineLength > start) {
        line = idx + 1;
        column = Math.max(1, start - walked + 1);
        break;
      }
      walked += lineLength;
    }

    const messageText =
      typeof diagnostic.messageText === "string"
        ? diagnostic.messageText
        : diagnostic.messageText.messageText;

    return FORMAT_WORKSPACE_DIAGNOSTIC(filePath, line, column, messageText);
  });
}

async function collectTranspileErrors(
  files: SchedulingFiles,
): Promise<string[]> {
  const codeEntries = Object.entries(files).filter(([path]) =>
    SOURCE_CODE_EXTENSION_REGEX.test(path),
  );

  if (!codeEntries.length) {
    return [];
  }

  const ts = await import("typescript");
  const transpileErrors: string[] = [];

  for (const [filePath, content] of codeEntries) {
    const transpileResult = ts.transpileModule(content ?? "", {
      fileName: filePath,
      reportDiagnostics: true,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    });

    const diagnostics = (transpileResult.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );

    if (!diagnostics.length) {
      continue;
    }

    transpileErrors.push(
      ...formatDiagnostics(
        filePath,
        content ?? "",
        diagnostics.map((diagnostic) => ({
          messageText: ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n",
          ),
          start: diagnostic.start,
        })),
      ),
    );

    if (transpileErrors.length >= MAX_TRANSPILE_ERRORS) {
      break;
    }
  }

  return transpileErrors.slice(0, MAX_TRANSPILE_ERRORS);
}

function validateWorkerRequiredFiles(
  workerType: WorkerType,
  files: SchedulingFiles,
): WorkspacePreflightResult {
  let reasonForFailure : FailureTypeWorker | null = null;

  switch (workerType) {
    case WorkerType.JAVASCRIPT_DEFAULT: {
      const typescriptFile = Object.keys(files).find((path) => path.startsWith(SOURCE_DIRECTORY_PREFIX) && TYPESCRIPT_SOURCE_EXTENSION_REGEX.test(path));

      if (typescriptFile) {
        reasonForFailure = FailureTypeWorker.TYPESCRIPT_NOT_ALLOWED;
      }

      if (!hasAnyFile(files, JAVASCRIPT_ENTRY_FILE_PATHS)) {
        reasonForFailure = FailureTypeWorker.HAS_NO_PRINCIPAL_ARCHIVE;
      }

      if (!hasEsmMainExport(files[JAVASCRIPT_ENTRY_FILE_PATHS[0]] ?? "")) {
        reasonForFailure = FailureTypeWorker.EXPORTS_NOT_FOUND;
      }

      break;
    }

    case WorkerType.NODE_DEFAULT:
    case WorkerType.NODE_DEFAULT_POSTGRESQL:
    case WorkerType.NODE_GRPCJS: {
      if (!hasAnyFile(files, NODE_ENTRY_FILE_PATHS)) {
        reasonForFailure = FailureTypeWorker.HAS_NO_PRINCIPAL_ARCHIVE;
      }

      const mainContent = files[NODE_ENTRY_FILE_PATHS[0]] ?? files[NODE_ENTRY_FILE_PATHS[1]];

      if (!hasMainExport(mainContent)) {
        reasonForFailure = FailureTypeWorker.EXPORTS_NOT_FOUND;
      }

      break;
    }

    case WorkerType.NODE_NESTJS:
    case WorkerType.NODE_NESTJS_POSTGRESQL: {
      const hasNestSource = Object.keys(files).some((path) => path.startsWith(SOURCE_DIRECTORY_PREFIX) && path.endsWith(TYPESCRIPT_FILE_EXTENSION));

      if (!hasNestSource) {
        reasonForFailure = FailureTypeWorker.MIN_STRCTURE_NUXT;
      }

      break;
    }

    case WorkerType.NODE_NEXTJS_CYPRESS: {
      if (!hasAnyFile(files, NEXT_ENTRY_FILE_PATHS)) {
        reasonForFailure = FailureTypeWorker.PRINCIPAL_PAGE_NOT_FOUND;
      }

      break;
    }

    case WorkerType.NODE_REACTJS_CYPRESS: {
      if (!hasAnyFile(files, REACT_COMPONENT_FILE_PATHS)) {
        reasonForFailure = FailureTypeWorker.PRINCIPAL_COMPONENT_NOT_FOUND;
      }

      if (!hasAnyFile(files, REACT_ENTRY_FILE_PATHS)) {
        reasonForFailure = FailureTypeWorker.ENTRY_POINT_NOT_FOUND;
      }

      break;
    }

    case WorkerType.PYTHON_DEFAULT: {
      if (!hasAnyFile(files, PYTHON_ENTRY_FILE_PATHS)) {
        return WORKSPACE_PREFLIGHT_RESPONSES.pythonEntryMissing();
      }

      const mainContent = files[PYTHON_ENTRY_FILE_PATHS[0]] ?? "";
      if (!hasPythonMain(mainContent)) {
        return WORKSPACE_PREFLIGHT_RESPONSES.pythonMainMissing();
      }

      break;
    }
  }

  if (reasonForFailure !== null) {
    const obj = WORKSPACE_PREFLIGHT_FAILURE_RESPONSES[reasonForFailure];

    return {
      ...DEFAULT_WORKSPACE_PREFLIGHT_RESPONSE,
      ...obj,
    };
  }

  return DEFAULT_WORKSPACE_PREFLIGHT_RESPONSE;
}

export async function runWorkspacePreflight({
  workerType,
  files,
}: RunWorkspacePreflightParams): Promise<WorkspacePreflightResult> {
  if (!files || Object.keys(files).length === 0) {
    return WORKSPACE_PREFLIGHT_RESPONSES.noFiles();
  }

  const normalizedWorkerType = normalizeWorkerType(workerType);
  if (!normalizedWorkerType) {
    return WORKSPACE_PREFLIGHT_RESPONSES.unknownWorker();
  }

  const requiredFilesValidation = validateWorkerRequiredFiles(
    normalizedWorkerType,
    files,
  );

  if (!requiredFilesValidation.ok) {
    return requiredFilesValidation;
  }

  try {
    const transpileErrors = await collectTranspileErrors(files);

    if (transpileErrors.length > 0) {
      return WORKSPACE_PREFLIGHT_RESPONSES.transpileErrors(transpileErrors);
    }
  } catch (error) {
    console.error(WORKSPACE_PREFLIGHT_LOG_ERROR, error);
    return WORKSPACE_PREFLIGHT_RESPONSES.unavailable();
  }

  return { ok: true };
}
