import { FileNode } from "@/types/shared";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { WorkerDefaultTemplateMap } from "@/app/admin/assignments/constants";

/**
 * Returns the appropriate file extension based on worker type
 */
function getFileExtension(workerType: WorkerType): string {
  switch (workerType) {
    case WorkerType.NODE_NEXTJS_CYPRESS:
    case WorkerType.NODE_REACTJS_CYPRESS:
      return ".tsx";
    default:
      return ".ts";
  }
}

/**
 * Returns the appropriate file name based on worker type
 */
function getFileName(workerType: WorkerType): string {
  const ext = getFileExtension(workerType);
  
  switch (workerType) {
    case WorkerType.NODE_NEXTJS_CYPRESS:
      return `page${ext}`;
    case WorkerType.NODE_REACTJS_CYPRESS:
      return `App${ext}`;
    default:
      return `app${ext}`;
  }
}

/**
 * Creates a default file node structure based on worker type
 * @param workerType - The type of worker environment
 * @param boilerplate - Optional custom boilerplate content (overrides default)
 */
export function createDefaultFileNode(
  workerType: WorkerType,
  boilerplate?: string
): FileNode {
  const fileName = getFileName(workerType);
  const content = boilerplate ?? WorkerDefaultTemplateMap[workerType];
  
  return {
    id: "src",
    isFile: false,
    children: [
      {
        id: fileName,
        isFile: true,
        isSelectable: true,
        content,
        path: `src/${fileName}`,
      },
    ],
    isSelectable: false,
    path: "src",
  };
}

/**
 * Default file node for NODE_DEFAULT worker type (backward compatibility)
 */
export const DEFAULT_FILE_NODE: FileNode = createDefaultFileNode(
  WorkerType.NODE_DEFAULT
);