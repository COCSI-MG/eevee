import type { SchedulingPreviewRunStatus } from "@/app/interface/scheduler-api/scheduling";
import { WorkerType } from "@/app/interface/scheduler-api/worker";

import type { WorkspacePreflightResult } from "./workspace-preflight.utils";

export const WORKSPACE_DRAG_MIME_TYPE     = "application/x-eevee-workspace-node-path";
export const WORKSPACE_DRAG_AREA_SELECTOR = '[data-eevee-workspace-drag-area="true"]';

export const WORKSPACE_STORAGE_KEY_PREFIX = "workspace";

export const PROCESSING_ATTEMPT_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "enqueded",
  "running",
]);

export const ACTIVE_PREVIEW_RUN_STATUSES: ReadonlySet<SchedulingPreviewRunStatus> = new Set(["pending", "running"]);

export const COMPLETED_PREVIEW_RUN_STATUS: SchedulingPreviewRunStatus = "completed";
export const FAILED_PREVIEW_RUN_STATUS: SchedulingPreviewRunStatus = "failed";
export const PREVIEW_RUN_FALLBACK_ERROR = "Preview failed";

export const DEFAULT_APPLICATION_FILE_CANDIDATES: readonly string[] = [
  "src/app.ts",
  "src/app.js",
  "app.ts",
  "app.js",
];

export const APPLICATION_FILE_CANDIDATES_BY_WORKER: Partial<Record<WorkerType, readonly string[]>> = {
  [WorkerType.PYTHON_DEFAULT]: ["src/app.py", "app.py"],
  [WorkerType.NODE_REACTJS_CYPRESS]: ["src/App.tsx", "src/App.jsx"],
  [WorkerType.NODE_NEXTJS_CYPRESS]: ["src/page.tsx", "src/page.jsx"],
};

export const SCHEDULING_APPLICATION_FILE_PATHS: readonly string[] = [
  "app.ts",
  "src/app.ts",
  "app.js",
  "src/app.js",
  "app.py",
  "src/app.py",
];

export const ASSIGNMENT_README_PATH = "src/README.md";
export const ASSIGNMENT_README_FILE_NAME = "README.md";
export const DEFAULT_ASSIGNMENT_TITLE = "Assignment";
export const DEFAULT_ASSIGNMENT_DESCRIPTION = "No description provided.";
export const REACT_ASSIGNMENT_APP_PATH = "src/App.tsx";
export const FORMAT_ASSIGNMENT_README_CONTENT = (title: string,description: string): string => `# ${title}\n\n${description}\n`;

export const WORKSPACE_ITEM_TYPE = {
  FILE: "file",
  FOLDER: "folder",
} as const;

export const WORKSPACE_MOVE_FAILURE_REASON = {
  SOURCE_NOT_FOUND: "source-not-found",
  ROOT: "root",
  INVALID_TARGET: "invalid-target",
  SAME_LOCATION: "same-location",
  DESCENDANT: "descendant",
  DUPLICATE: "duplicate",
  MAX_DEPTH: "max-depth",
} as const;

export const INVALID_WORKSPACE_ITEM_NAME_PATTERN = /[<>:"/\\|?*\x00-\x1F]/;

export const WORKSPACE_TREE_MESSAGES = {
  emptyName: "Name cannot be empty",
  invalidName: "Name contains invalid characters",
  duplicateName: "An item with this name already exists in the target location",
  itemNotFound: "Item not found",
  rootLabel: "root",
  sourceNotFound: "O item arrastado não foi encontrado.",
  rootMoveForbidden: "A pasta raiz do workspace não pode ser movida.",
  invalidMoveTarget: "Solte o item sobre uma pasta ou na raiz do workspace.",
  sameMoveLocation: "O item já está nesta pasta.",
  descendantMoveForbidden: "Uma pasta não pode ser movida para dentro dela mesma.",
  maxCreateDepth: (maxDepth: number): string => `Maximum depth of ${maxDepth} levels reached. Cannot create items deeper.`,
  maxFiles: (maxFiles: number): string => `Maximum of ${maxFiles} files reached. Delete some files first.`,
  duplicateMove: (itemName: string): string => `Já existe um item chamado "${itemName}" nessa pasta.`,
  maxMoveDepth: (maxDepth: number): string => `O movimento ultrapassaria o limite de ${maxDepth} níveis.`
} as const;

export const SUPPORTED_WORKERS: ReadonlySet<WorkerType> = new Set(Object.values(WorkerType));

export const SOURCE_CODE_EXTENSION_REGEX = /\.(ts|tsx|js|jsx)$/i;
export const TYPESCRIPT_SOURCE_EXTENSION_REGEX = /\.(?:ts|tsx)$/i;
export const PYTHON_MAIN_PATTERN = /^\s*def\s+main\s*\(/m;
export const SOURCE_DIRECTORY_PREFIX = "src/";
export const TYPESCRIPT_FILE_EXTENSION = ".ts";
export const MAX_TRANSPILE_ERRORS = 10;

export const MAIN_EXPORT_PATTERNS: readonly RegExp[] = [
  /export\s+(?:async\s+)?function\s+main\b/,
  /export\s+(?:const|let|var)\s+main\b/,
  /export\s*\{[^}]*\bmain\b[^}]*\}/,
  /module\.exports\s*=\s*\{[^}]*\bmain\b[^}]*\}/,
];

export const ESM_MAIN_EXPORT_PATTERNS: readonly RegExp[] =
  MAIN_EXPORT_PATTERNS.slice(0, 3);

export const JAVASCRIPT_ENTRY_FILE_PATHS: readonly string[] = ["src/app.js"];
export const NODE_ENTRY_FILE_PATHS: readonly string[] = [
  "src/app.ts",
  "src/app.js",
];
export const NEXT_ENTRY_FILE_PATHS: readonly string[] = [
  "src/page.tsx",
  "src/page.jsx",
];
export const REACT_COMPONENT_FILE_PATHS: readonly string[] = [
  "src/App.tsx",
  "src/App.jsx",
];
export const REACT_ENTRY_FILE_PATHS: readonly string[] = [
  "src/main.tsx",
  "src/main.jsx",
];
export const PYTHON_ENTRY_FILE_PATHS: readonly string[] = ["src/app.py"];

export enum FailureTypeWorker {
  TYPESCRIPT_NOT_ALLOWED,
  HAS_NO_PRINCIPAL_ARCHIVE,
  EXPORTS_NOT_FOUND,
  MIN_STRCTURE_NUXT,
  PRINCIPAL_PAGE_NOT_FOUND,
  PRINCIPAL_COMPONENT_NOT_FOUND,
  ENTRY_POINT_NOT_FOUND,
}

export const DEFAULT_WORKSPACE_PREFLIGHT_RESPONSE: WorkspacePreflightResult = {
  ok: true,
  message: "Worker validado com sucesso.",
  details: [],
};

export const WORKSPACE_PREFLIGHT_FAILURE_RESPONSES: Record<
  FailureTypeWorker,
  WorkspacePreflightResult
> = {
  [FailureTypeWorker.TYPESCRIPT_NOT_ALLOWED]: {
    message: "Tipo de arquivo não permitido.",
    details: ["Esperado o arquivo src/app.js para este worker."],
    ok: false,
  },
  [FailureTypeWorker.HAS_NO_PRINCIPAL_ARCHIVE]: {
    message: "Arquivo principal não encontrado.",
    details: ["Esperado o arquivo src/app.js para este worker."],
    ok: false,
  },
  [FailureTypeWorker.EXPORTS_NOT_FOUND]: {
    message: "Exportações não encontradas.",
    details: ["Use a exportação da função main no arquivo src/app.js."],
    ok: false,
  },
  [FailureTypeWorker.MIN_STRCTURE_NUXT]: {
    message: "Estrutura mínima do Nuxt não encontrada.",
    details: ["Inclua pelo menos um arquivo TypeScript dentro de src/."],
    ok: false,
  },
  [FailureTypeWorker.PRINCIPAL_PAGE_NOT_FOUND]: {
    message: "Página principal não encontrada.",
    details: ["Esperado arquivo src/page.tsx (ou src/page.jsx)."],
    ok: false,
  },
  [FailureTypeWorker.PRINCIPAL_COMPONENT_NOT_FOUND]: {
    message: "Componente principal não encontrado.",
    details: ["Esperado arquivo src/App.tsx (ou src/App.jsx)."],
    ok: false,
  },
  [FailureTypeWorker.ENTRY_POINT_NOT_FOUND]: {
    message: "Entry point da aplicação não encontrado.",
    details: ["Esperado arquivo src/main.tsx (ou src/main.jsx)."],
    ok: false,
  },
};

export const WORKSPACE_PREFLIGHT_RESPONSES = {
  pythonEntryMissing: (): WorkspacePreflightResult => ({
    ok: false,
    message: "Arquivo principal ausente",
    details: ["Esperado um arquivo src/app.py para este tipo de worker."],
  }),
  pythonMainMissing: (): WorkspacePreflightResult => ({
    ok: false,
    message: "Função principal não encontrada",
    details: [
      "Seu código precisa definir uma função main para que os testes consigam importar o módulo.",
    ],
  }),
  noFiles: (): WorkspacePreflightResult => ({
    ok: false,
    message: "Nenhum arquivo para validar",
    details: [
      "Salve ou crie arquivos no workspace antes de executar o worker.",
    ],
  }),
  unknownWorker: (): WorkspacePreflightResult => ({
    ok: true,
    details: [
      "Worker não reconhecido para validação local. A execução seguirá no servidor.",
    ],
  }),
  transpileErrors: (details: string[]): WorkspacePreflightResult => ({
    ok: false,
    message: "Erros de sintaxe/compilação detectados",
    details,
  }),
  unavailable: (): WorkspacePreflightResult => ({
    ok: true,
    details: [
      "Não foi possível executar a validação local completa. A execução seguirá no servidor.",
    ],
  }),
};

export const WORKSPACE_PREFLIGHT_LOG_ERROR = "Failed to run local preflight";

export const FORMAT_WORKSPACE_DIAGNOSTIC = (
  filePath: string,
  line: number,
  column: number,
  messageText: string,
): string => `${filePath}:${line}:${column} - ${messageText}`;
