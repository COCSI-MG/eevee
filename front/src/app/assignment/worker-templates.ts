import { FileNode } from "@/types/shared";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import {
  DEFAULT_REACTJS_CYPRESS_WORKSPACE_FILES,
  WorkerDefaultTemplateMap,
} from "@/app/admin/assignments/constants";
import { getWorkerLanguageConfig } from "@/lib/monaco/worker-editor-config";

/**
 * Creates a default file node structure based on worker type
 * @param workerType - The type of worker environment
 * @param boilerplate - Optional custom boilerplate content (overrides default)
 */
export function createDefaultFileNode(
  workerType: WorkerType,
  boilerplate?: string
): FileNode {
  const createFileNode = (path: string, content: string): FileNode => ({
    id: path.split("/").pop() || path,
    isFile: true,
    isSelectable: true,
    content,
    path,
  });

  const createSrcRootNode = (children: FileNode[]): FileNode => ({
    id: "src",
    isFile: false,
    children,
    isSelectable: false,
    path: "src",
  });

  if (workerType === WorkerType.NODE_REACTJS_CYPRESS) {
    const reactWorkspaceFiles: Record<string, string> = {
      ...DEFAULT_REACTJS_CYPRESS_WORKSPACE_FILES,
      "src/App.tsx": boilerplate ?? WorkerDefaultTemplateMap[workerType],
    };

    const children = Object.keys(reactWorkspaceFiles)
      .sort()
      .map((path) => createFileNode(path, reactWorkspaceFiles[path]));

    return createSrcRootNode(children);
  }

  const { defaultFileName, fileExtension } = getWorkerLanguageConfig(workerType);
  const fileName = `${defaultFileName}${fileExtension}`;
  const content = boilerplate ?? WorkerDefaultTemplateMap[workerType];

  return createSrcRootNode([createFileNode(`src/${fileName}`, content)]);
}

/**
 * Default file node for NODE_DEFAULT worker type (backward compatibility)
 */
export const DEFAULT_FILE_NODE: FileNode = createDefaultFileNode(
  WorkerType.NODE_DEFAULT
);
