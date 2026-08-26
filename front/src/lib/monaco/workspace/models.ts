import { FileNode } from "@/types/shared";
import { languageForPath } from "../language";
import { normalizeWorkspacePath } from "./import-paths";

type MonacoNamespace = typeof import("monaco-editor");

/** URI strings of models created and owned by this module. */
const managedModelUris = new Set<string>();

export function workspaceModelPath(path: string): string {
  return `file:///${normalizeWorkspacePath(path)}`;
}

function collectFiles(node: FileNode | null): FileNode[] {
  if (!node) return [];
  if (node.isFile) return [node];
  if (!node.children?.length) return [];
  return node.children.flatMap((child) => collectFiles(child));
}

export function syncWorkspaceModels(
  monaco: MonacoNamespace,
  tree: FileNode | null,
  activePaths: Iterable<string> = [],
): void {
  const files = collectFiles(tree);
  const activeUris = new Set(Array.from(activePaths).map(workspaceModelPath));
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

    if (
      managedModelUris.has(uriString) &&
      !activeUris.has(uriString) &&
      existing.getValue() !== content
    ) {
      existing.setValue(content);
    }
  }

  for (const uriString of Array.from(managedModelUris)) {
    if (seen.has(uriString) || activeUris.has(uriString)) continue;

    const model = monaco.editor.getModel(monaco.Uri.parse(uriString));
    if (model && !model.isDisposed()) {
      model.dispose();
    }
    managedModelUris.delete(uriString);
  }
}

export function disposeWorkspaceModels(monaco: MonacoNamespace): void {
  for (const uriString of Array.from(managedModelUris)) {
    const model = monaco.editor.getModel(monaco.Uri.parse(uriString));
    if (model && !model.isDisposed()) {
      model.dispose();
    }
  }
  managedModelUris.clear();
}
