"use client";

import { createDefaultFileNode } from "@/app/assignment/worker-templates";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { WorkerType } from "@/app/interface/scheduler-api/worker";
import { FileNode } from "@/types/shared";

import {
  ASSIGNMENT_README_FILE_NAME,
  ASSIGNMENT_README_PATH,
  DEFAULT_ASSIGNMENT_DESCRIPTION,
  DEFAULT_ASSIGNMENT_TITLE,
  FORMAT_ASSIGNMENT_README_CONTENT,
  REACT_ASSIGNMENT_APP_PATH,
} from "./constant";

function buildAssignmentReadmeContent(assignment: Assignment): string {
  const title = assignment.title?.trim() || DEFAULT_ASSIGNMENT_TITLE;
  const description =
    assignment.description?.trim() || DEFAULT_ASSIGNMENT_DESCRIPTION;

  return FORMAT_ASSIGNMENT_README_CONTENT(title, description);
}

function createReadmeNode(content: string): FileNode {
  return {
    id: ASSIGNMENT_README_FILE_NAME,
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
      !hasPath(fileTree, REACT_ASSIGNMENT_APP_PATH))
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

function findNodeByPath(node: FileNode, expectedPath: string): FileNode | null {
  if (node.path === expectedPath) return node

  for (const child of node.children ?? []) {
    const found = findNodeByPath(child, expectedPath);

    if (found) return found
  }

  return null;
}

function normalizeSubmittedFilePath(filePath: string): string | null {

  const parts = filePath.replaceAll("\\", "/").split("/").filter(Boolean);

  if (parts.length === 0 || parts.some((part) => part === "." || part === "..")) return null

  return parts.join("/");
}

function sortWorkspaceTree(node: FileNode): void {

  node.children?.sort((left, right) => {
    if (Boolean(left.isFile) !== Boolean(right.isFile)) {
      return left.isFile ? 1 : -1
    }

    return left.id.localeCompare(right.id, "pt-BR")
  });

  node.children?.forEach(sortWorkspaceTree)
}

export function createImportedWorkspaceTree(
  files: Record<string, string>,
  destinationTree: FileNode,
  assignment: Assignment
): FileNode {

  const root: FileNode = {
    id: "src",
    path: "src",
    isFile: false,
    isSelectable: false,
    children: []
  };

  Object.entries(files)
    .map(([filePath, content]) => [normalizeSubmittedFilePath(filePath), content] as const)
    .filter( (entry): entry is readonly [string, string] => entry[0] !== null && entry[0] !== ASSIGNMENT_README_PATH)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .forEach(([filePath, content]) => {
      const pathParts = filePath.split("/");

      const relativeParts = pathParts[0] === root.path ? pathParts.slice(1) : pathParts;

      if (relativeParts.length === 0) return

      let parent = root;

      const parentPathParts = pathParts[0] === root.path ? [root.path] : [];

      relativeParts.slice(0, -1).forEach((folderName) => {
        parentPathParts.push(folderName)
        const folderPath = parentPathParts.join("/")

        let folder = parent.children?.find((child) => !child.isFile && child.path === folderPath);

        if (!folder) {
          folder = {
            id: folderName,
            path: folderPath,
            isFile: false,
            isSelectable: false,
            children: []
          };

          parent.children = [...(parent.children ?? []), folder];


        }

        parent = folder;
      });

      parent.children = [
        ...(parent.children ?? []),
        {
          id: relativeParts.at(-1)!,
          path: filePath,
          isFile: true,
          isSelectable: true,
          content
        }
      ];
    });

  const destinationReadme = findNodeByPath(destinationTree, ASSIGNMENT_README_PATH);

  const importedTree = destinationReadme
    ? {
        ...root,
        children: [
          serializeWorkspaceTree(destinationReadme),
          ...(root.children ?? []),
        ],
      }
    : ensureAssignmentReadme(root, assignment);

  sortWorkspaceTree(importedTree);
  return importedTree;
}

export function serializeWorkspaceTree(node: FileNode): FileNode {
  return {
    id: node.id,
    isSelectable: Boolean(node.isSelectable),
    path: node.path,
    isFile: Boolean(node.isFile),
    content: node.content,
    updatedAt: node.updatedAt,
    children: node.children?.map(serializeWorkspaceTree),
  }
}

export function getFileLanguage(fileName: string): string {
  return fileName.split(".").pop() || "";
}
