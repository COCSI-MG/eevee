"use client";

import { createDefaultFileNode } from "@/app/assignment/worker-templates";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { FileNode } from "@/types/shared";

export function hasPath(node: FileNode, expectedPath: string): boolean {
  if (node.path === expectedPath) {
    return true;
  }

  if (!node.children?.length) {
    return false;
  }

  return node.children.some((child) => hasPath(child, expectedPath));
}

export function findFirstFile(node: FileNode): FileNode | null {
  if (node.isFile) {
    return node;
  }

  if (!node.children?.length) {
    return null;
  }

  for (const child of node.children) {
    const found = findFirstFile(child);
    if (found) {
      return found;
    }
  }

  return null;
}

export function getAssignmentBoilerplate(assignment: Assignment): string {
  return assignment.boilerplateContent ?? assignment.boilerplate ?? "";
}

export function shouldRebuildWorkspaceTree(
  assignment: Assignment,
  fileTree: FileNode | null,
): boolean {
  return (
    assignment.workerType === WorkerType.NODE_REACTJS_CYPRESS &&
    (!fileTree ||
      !fileTree.children?.length ||
      !hasPath(fileTree, "src/App.tsx"))
  );
}

export function createInitialWorkspaceTree(assignment: Assignment): FileNode {
  return createDefaultFileNode(
    assignment.workerType as WorkerType,
    getAssignmentBoilerplate(assignment),
  );
}

export function getFileLanguage(fileName: string): string {
  return fileName.split(".").pop() || "";
}
