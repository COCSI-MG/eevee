import { FileNode } from "@/types/shared";

type MonacoNamespace = typeof import("monaco-editor");

/**
 * URI strings of the models this module owns. We only ever dispose models we
 * created ourselves, never the ones Monaco/the editor manages internally.
 */
const managedModelUris = new Set<string>();

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  html: "html",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
};

function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_LANGUAGE_MAP[ext] ?? "typescript";
}

function normalizePath(path: string): string {
  return path.split("/").filter(Boolean).join("/");
}

/**
 * Builds the canonical `file:///` URI for a workspace path. This MUST match the
 * `path` prop handed to `<Editor />` so the active model and the synced models
 * share the same identity and TypeScript module resolution lines up.
 */
export function workspaceModelPath(path: string): string {
  return `file:///${normalizePath(path)}`;
}

function collectFiles(node: FileNode | null): FileNode[] {
  if (!node) return [];
  if (node.isFile) return [node];
  if (!node.children?.length) return [];
  return node.children.flatMap((child) => collectFiles(child));
}

/**
 * Tier 1 IntelliSense: mirror every file in the workspace tree as a Monaco
 * model so imports between the student's own files resolve (completions,
 * go-to-definition, rename, cross-file diagnostics).
 *
 * @param activePath Path of the file currently open in the editor. Its content
 * is owned by the editor, so we never overwrite it here.
 */
export function syncWorkspaceModels(
  monaco: MonacoNamespace,
  tree: FileNode | null,
  activePath?: string,
): void {
  const files = collectFiles(tree);
  const activeUri = activePath ? workspaceModelPath(activePath) : undefined;
  const seen = new Set<string>();

  for (const file of files) {
    const uriString = workspaceModelPath(file.path);
    seen.add(uriString);

    const uri = monaco.Uri.parse(uriString);
    const content = file.content ?? "";
    const existing = monaco.editor.getModel(uri);

    if (!existing) {
      monaco.editor.createModel(content, languageForPath(file.path), uri);
      managedModelUris.add(uriString);
      continue;
    }

    // Never clobber the file the user is actively editing.
    if (
      managedModelUris.has(uriString) &&
      uriString !== activeUri &&
      existing.getValue() !== content
    ) {
      existing.setValue(content);
    }
  }

  // Dispose models for files that no longer exist in the tree.
  for (const uriString of Array.from(managedModelUris)) {
    if (seen.has(uriString) || uriString === activeUri) continue;

    const model = monaco.editor.getModel(monaco.Uri.parse(uriString));
    if (model && !model.isDisposed()) {
      model.dispose();
    }
    managedModelUris.delete(uriString);
  }
}

/**
 * Disposes every model this module created. Call on editor unmount so switching
 * assignments does not leak models across sessions.
 */
export function disposeWorkspaceModels(monaco: MonacoNamespace): void {
  for (const uriString of Array.from(managedModelUris)) {
    const model = monaco.editor.getModel(monaco.Uri.parse(uriString));
    if (model && !model.isDisposed()) {
      model.dispose();
    }
  }
  managedModelUris.clear();
}
