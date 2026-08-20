import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { SchedulingFiles } from "@/app/interface/scheduler-api/scheduling";

export interface WorkspacePreflightResult {
  ok: boolean;
  message?: string;
  details?: string[];
}

interface RunWorkspacePreflightParams {
  workerType?: string;
  files?: SchedulingFiles;
}

const SUPPORTED_WORKERS = new Set<WorkerType>(Object.values(WorkerType));
const SOURCE_CODE_EXTENSION_REGEX = /\.(ts|tsx|js|jsx)$/i;

function normalizeWorkerType(workerType?: string): WorkerType | null {
  if (!workerType) {
    return null;
  }

  if (!SUPPORTED_WORKERS.has(workerType as WorkerType)) {
    return null;
  }

  return workerType as WorkerType;
}

function hasAnyFile(files: SchedulingFiles, paths: string[]): boolean {
  return paths.some((path) => typeof files[path] === "string");
}

function hasMainExport(content: string): boolean {
  const mainExportPatterns = [
    /export\s+(?:async\s+)?function\s+main\b/,
    /export\s+(?:const|let|var)\s+main\b/,
    /export\s*\{[^}]*\bmain\b[^}]*\}/,
    /module\.exports\s*=\s*\{[^}]*\bmain\b[^}]*\}/,
  ];

  return mainExportPatterns.some((pattern) => pattern.test(content));
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

    return `${filePath}:${line}:${column} - ${messageText}`;
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

    if (transpileErrors.length >= 10) {
      break;
    }
  }

  return transpileErrors.slice(0, 10);
}

function validateWorkerRequiredFiles(
  workerType: WorkerType,
  files: SchedulingFiles,
): WorkspacePreflightResult {
  switch (workerType) {
    case WorkerType.NODE_DEFAULT:
    case WorkerType.NODE_DEFAULT_POSTGRESQL:
    case WorkerType.NODE_GRPCJS: {
      if (!hasAnyFile(files, ["src/app.ts", "src/app.js"])) {
        return {
          ok: false,
          message: "Arquivo principal ausente",
          details: [
            "Esperado um arquivo src/app.ts (ou src/app.js) para este tipo de worker.",
          ],
        };
      }

      const mainContent = files["src/app.ts"] ?? files["src/app.js"] ?? "";
      if (!hasMainExport(mainContent)) {
        return {
          ok: false,
          message: "Export principal não encontrado",
          details: [
            "Seu código precisa exportar uma função main para que os testes consigam importar o módulo.",
          ],
        };
      }

      return { ok: true };
    }

    case WorkerType.NODE_NESTJS:
    case WorkerType.NODE_NESTJS_POSTGRESQL: {
      const hasNestSource = Object.keys(files).some(
        (path) => path.startsWith("src/") && path.endsWith(".ts"),
      );

      if (!hasNestSource) {
        return {
          ok: false,
          message: "Estrutura mínima do NestJS não encontrada",
          details: ["Inclua pelo menos um arquivo TypeScript dentro de src/."],
        };
      }

      return { ok: true };
    }

    case WorkerType.NODE_NEXTJS_CYPRESS: {
      if (!hasAnyFile(files, ["src/page.tsx", "src/page.jsx"])) {
        return {
          ok: false,
          message: "Página principal não encontrada",
          details: ["Esperado arquivo src/page.tsx (ou src/page.jsx)."],
        };
      }

      return { ok: true };
    }

    case WorkerType.NODE_REACTJS_CYPRESS: {
      if (!hasAnyFile(files, ["src/App.tsx", "src/App.jsx"])) {
        return {
          ok: false,
          message: "Componente principal não encontrado",
          details: ["Esperado arquivo src/App.tsx (ou src/App.jsx)."],
        };
      }

      if (!hasAnyFile(files, ["src/main.tsx", "src/main.jsx"])) {
        return {
          ok: false,
          message: "Entry point da aplicação não encontrado",
          details: ["Esperado arquivo src/main.tsx (ou src/main.jsx)."],
        };
      }

      return { ok: true };
    }

    case WorkerType.PYTHON_DEFAULT: {
      if (!hasAnyFile(files, ["src/app.py"])) {
        return {
          ok: false,
          message: "Arquivo principal ausente",
          details: [
            "Esperado um arquivo src/app.py para este tipo de worker.",
          ],
        };
      }

      return { ok: true };
    }

    default:
      return { ok: true };
  }
}

export async function runWorkspacePreflight({
  workerType,
  files,
}: RunWorkspacePreflightParams): Promise<WorkspacePreflightResult> {
  if (!files || Object.keys(files).length === 0) {
    return {
      ok: false,
      message: "Nenhum arquivo para validar",
      details: [
        "Salve ou crie arquivos no workspace antes de executar o worker.",
      ],
    };
  }

  const normalizedWorkerType = normalizeWorkerType(workerType);
  if (!normalizedWorkerType) {
    return {
      ok: true,
      details: [
        "Worker não reconhecido para validação local. A execução seguirá no servidor.",
      ],
    };
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
      return {
        ok: false,
        message: "Erros de sintaxe/compilação detectados",
        details: transpileErrors,
      };
    }
  } catch (error) {
    console.error("Failed to run local preflight", error);
    return {
      ok: true,
      details: [
        "Não foi possível executar a validação local completa. A execução seguirá no servidor.",
      ],
    };
  }

  return { ok: true };
}
