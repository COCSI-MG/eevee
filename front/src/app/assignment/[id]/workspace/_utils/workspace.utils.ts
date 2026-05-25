"use client";

import { createDefaultFileNode } from "@/app/assignment/worker-templates";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { FileNode } from "@/types/shared";

const ASSIGNMENT_README_PATH = "src/README.md";

function buildAssignmentReadmeContent(assignment: Assignment): string {
  const title = assignment.title?.trim() || "Assignment";
  const description =
    assignment.description?.trim() || "No description provided.";

  return `# ${title}\n\n${description}\n`;
}

function createReadmeNode(content: string): FileNode {
  return {
    id: "README.md",
    isFile: true,
    isSelectable: true,
    content,
    path: ASSIGNMENT_README_PATH,
  };
}

function insertReadmeFileIfMissing(node: FileNode, content: string): FileNode {
  if (node.isFile) {
    return node;
  }

  const readmeNode = createReadmeNode(content);
  const children = node.children ? [...node.children] : [];
  const readmeIndex = children.findIndex(
    (child) => child.path === ASSIGNMENT_README_PATH,
  );

  if (readmeIndex >= 0) {
    return node;
  }

  children.unshift(readmeNode);

  return {
    ...node,
    children,
  };
}

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
  const workspaceTree = createDefaultFileNode(
    assignment.workerType as WorkerType,
    getAssignmentBoilerplate(assignment),
  );

  return insertReadmeFileIfMissing(
    workspaceTree,
    buildAssignmentReadmeContent(assignment),
  );
}

export function ensureAssignmentReadme(
  fileTree: FileNode,
  assignment: Assignment,
): FileNode {
  return insertReadmeFileIfMissing(
    fileTree,
    buildAssignmentReadmeContent(assignment),
  );
}

export function getFileLanguage(fileName: string): string {
  return fileName.split(".").pop() || "";
}
