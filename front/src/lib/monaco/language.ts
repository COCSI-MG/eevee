import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { normalizeString } from "@/utils/string";
import { findWorkerEditorConfig } from "./worker-editor-config";

interface ResolveMonacoLanguageOptions {
  language?: string;
  path?: string;
  workerType?: WorkerType | string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  yml: "yaml",
  md: "markdown",
  htm: "html",
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ...LANGUAGE_ALIASES,
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  sql: "sql",
  json: "json",
  css: "css",
  scss: "scss",
  html: "html",
  markdown: "markdown",
  yaml: "yaml",
};

export function normalizeMonacoLanguage(language?: string): string | undefined {
  const normalized = normalizeString(language);

  if (!normalized) return undefined;

  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export function languageForPath(path?: string): string | undefined {
  const normalizedPath = normalizeString(path).split(/[?#]/, 1)[0];

  const extension = normalizedPath.split(".").pop() ?? "";

  return EXTENSION_LANGUAGE_MAP[extension] ?? "plaintext";
}

export function resolveMonacoLanguage({
  language,
  path,
  workerType,
}: ResolveMonacoLanguageOptions): string {
  const explicitLanguage = normalizeMonacoLanguage(language);
  if (explicitLanguage) return explicitLanguage;

  const pathLanguage = languageForPath(path);
  if (pathLanguage) return pathLanguage;

  const workerLanguage = findWorkerEditorConfig(workerType)?.editorLanguage;

  return workerLanguage ?? "plaintext";
}
