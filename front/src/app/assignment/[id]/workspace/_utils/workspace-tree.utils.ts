import { FileNode, SelectedItem } from "@/types/shared";

import {
  INVALID_WORKSPACE_ITEM_NAME_PATTERN,
  WORKSPACE_ITEM_TYPE,
  WORKSPACE_MOVE_FAILURE_REASON,
  WORKSPACE_TREE_MESSAGES,
} from "./constant";

export type WorkspaceItemType = (typeof WORKSPACE_ITEM_TYPE)[keyof typeof WORKSPACE_ITEM_TYPE];

export type WorkspaceMoveFailureReason = (typeof WORKSPACE_MOVE_FAILURE_REASON)[keyof typeof WORKSPACE_MOVE_FAILURE_REASON];

export type WorkspaceMoveFailure = {
  ok: false;
  reason: WorkspaceMoveFailureReason;
  message: string;
};

export type WorkspaceMoveResult =
  | {
      ok: true;
      movedTree: FileNode;
      oldPath: string;
      newPath: string;
    }
  | WorkspaceMoveFailure;

export function getPathDepth(path: string): number {
  if (!path) return 0;

  return path.split("/").filter(Boolean).length;
}

export function getParentPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts.slice(0, -1).join("/");
}

export function getBaseName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export function countFiles(node: FileNode | null): number {
  if (!node) return 0;
  if (node.isFile) return 1;

  return (
    node.children?.reduce((count, child) => count + countFiles(child), 0) ?? 0
  );
}

export function findNodeByPath(
  node: FileNode | null,
  targetPath: string,
): FileNode | null {
  if (!node) {
    return null;
  }

  if (node.path === targetPath) {
    return node;
  }

  if (!node.children?.length) {
    return null;
  }

  for (const child of node.children) {
    const found = findNodeByPath(child, targetPath);
    if (found) {
      return found;
    }
  }

  return null;
}

export function updateFileContent(
  node: FileNode,
  filePath: string,
  content: string,
): FileNode {
  if (node.path === filePath && node.isFile) {
    return {
      ...node,
      content,
      updatedAt: new Date().toISOString(),
    };
  }

  if (!node.children?.length) return node;

  const updatedChildren = node.children.map((child) =>
    updateFileContent(child, filePath, content),
  );

  const hasChanges = updatedChildren.some(
    (child, index) => child !== node.children![index],
  );

  return hasChanges ? { ...node, children: updatedChildren } : node;
}

export function fileNameExistsInNode(
  node: FileNode,
  targetPath: string,
  name: string,
): boolean {
  if (node.path === targetPath) {
    return node.children?.some((child) => child.id === name) ?? false;
  }

  if (!node.children?.length) {
    return false;
  }

  for (const child of node.children) {
    if (fileNameExistsInNode(child, targetPath, name)) {
      return true;
    }
  }

  return false;
}

export function validateWorkspaceItemName(name: string): string | null {
  if (!name || name.trim() === "") {
    return WORKSPACE_TREE_MESSAGES.emptyName;
  }

  if (INVALID_WORKSPACE_ITEM_NAME_PATTERN.test(name)) {
    return WORKSPACE_TREE_MESSAGES.invalidName;
  }

  return null;
}

export function getWorkspaceCreateTargetPath(
  selectedItem: SelectedItem,
  treeData: FileNode | null,
): string {
  if (selectedItem.type === WORKSPACE_ITEM_TYPE.FOLDER && selectedItem.path) {
    return selectedItem.path;
  }

  if (selectedItem.path) {
    return getParentPath(selectedItem.path);
  }

  return treeData?.path ?? "";
}

export function getWorkspaceCreateTargetLabel(
  selectedItem: SelectedItem,
  treeData: FileNode | null,
): string {
  if (selectedItem.type === WORKSPACE_ITEM_TYPE.FOLDER && selectedItem.id) {
    return selectedItem.id;
  }

  const targetPath = getWorkspaceCreateTargetPath(selectedItem, treeData);
  return targetPath || WORKSPACE_TREE_MESSAGES.rootLabel;
}

export function validateCreateWorkspaceItem(params: {
  name: string;
  targetPath: string;
  itemType: WorkspaceItemType;
  treeData: FileNode | null;
  maxDepth: number;
  maxFiles: number;
}): string | null {
  const { name, targetPath, itemType, treeData, maxDepth, maxFiles } = params;

  const nameError = validateWorkspaceItemName(name);
  if (nameError) {
    return nameError;
  }

  if (treeData && fileNameExistsInNode(treeData, targetPath, name)) {
    return WORKSPACE_TREE_MESSAGES.duplicateName;
  }

  if (getPathDepth(targetPath) + 1 > maxDepth) {
    return WORKSPACE_TREE_MESSAGES.maxCreateDepth(maxDepth);
  }

  if (itemType === WORKSPACE_ITEM_TYPE.FILE && countFiles(treeData) >= maxFiles) {
    return WORKSPACE_TREE_MESSAGES.maxFiles(maxFiles);
  }

  return null;
}

export function validateRenameWorkspaceItem(params: {
  treeData: FileNode | null;
  targetPath: string;
  newName: string;
}): string | null {
  const { treeData, targetPath, newName } = params;
  const targetNode = findNodeByPath(treeData, targetPath);

  if (!targetNode) {
    return WORKSPACE_TREE_MESSAGES.itemNotFound;
  }

  const trimmedName = newName.trim();
  const nameError = validateWorkspaceItemName(trimmedName);
  if (nameError) {
    return nameError;
  }

  const parentPath = getParentPath(targetPath);
  if (
    trimmedName !== targetNode.id &&
    treeData &&
    fileNameExistsInNode(treeData, parentPath, trimmedName)
  ) {
    return WORKSPACE_TREE_MESSAGES.duplicateName;
  }

  return null;
}

function updateNodePaths(
  node: FileNode,
  oldPath: string,
  newPath: string,
): FileNode {
  const updatedPath = node.path.startsWith(oldPath)
    ? `${newPath}${node.path.slice(oldPath.length)}`
    : node.path;

  return {
    ...node,
    path: updatedPath,
    children: node.children?.map((child) =>
      updateNodePaths(child, oldPath, newPath),
    ),
  };
}

export function addItemToTree(
  node: FileNode,
  targetPath: string,
  newItem: FileNode,
): FileNode {
  if (node.isFile) {
    return node;
  }

  if (node.path === targetPath) {
    const updatedChildren = node.children
      ? [...node.children, newItem]
      : [newItem];

    return {
      ...node,
      children: updatedChildren,
    };
  }

  if (!node.children?.length) {
    return node;
  }

  const updatedChildren = node.children.map((child) =>
    addItemToTree(child, targetPath, newItem),
  );

  const hasChanges = updatedChildren.some(
    (child, index) => child !== node.children![index],
  );

  if (!hasChanges) {
    return node;
  }

  return {
    ...node,
    children: updatedChildren,
  };
}

export function removeItemFromTree(
  node: FileNode,
  targetPath: string,
): FileNode {
  if (!node.children?.length) {
    return node;
  }

  const updatedChildren = node.children
    .filter((child) => child.path !== targetPath)
    .map((child) => removeItemFromTree(child, targetPath));

  if (
    updatedChildren.length !== node.children.length ||
    updatedChildren.some((child, index) => child !== node.children![index])
  ) {
    return {
      ...node,
      children: updatedChildren.length > 0 ? updatedChildren : undefined,
    };
  }

  return node;
}

function extractNodeFromTree(
  node: FileNode,
  sourcePath: string,
): { tree: FileNode; extracted: FileNode | null } {
  if (!node.children?.length) {
    return { tree: node, extracted: null };
  }

  let extracted: FileNode | null = null;

  const updatedChildren = node.children
    .filter((child) => {
      if (child.path === sourcePath) {
        extracted = child;
        return false;
      }

      return true;
    })
    .map((child) => {
      const result = extractNodeFromTree(child, sourcePath);
      if (result.extracted) {
        extracted = result.extracted;
      }

      return result.tree;
    });

  const hasChanges =
    !!extracted ||
    updatedChildren.length !== node.children.length ||
    updatedChildren.some((child, index) => child !== node.children![index]);

  if (!hasChanges) {
    return { tree: node, extracted: null };
  }

  return {
    tree: {
      ...node,
      children: updatedChildren.length > 0 ? updatedChildren : undefined,
    },
    extracted,
  };
}

function insertItemInFolder(
  node: FileNode,
  targetFolderPath: string,
  item: FileNode,
): FileNode {
  if (node.isFile) {
    return node;
  }

  if (node.path === targetFolderPath) {
    const updatedChildren = node.children ? [...node.children, item] : [item];

    return {
      ...node,
      children: updatedChildren,
    };
  }

  if (!node.children?.length) {
    return node;
  }

  const updatedChildren = node.children.map((child) =>
    insertItemInFolder(child, targetFolderPath, item),
  );

  const hasChanges = updatedChildren.some(
    (child, index) => child !== node.children![index],
  );

  if (!hasChanges) {
    return node;
  }

  return {
    ...node,
    children: updatedChildren,
  };
}

function getSubtreeRelativeDepth(node: FileNode): number {
  if (!node.children?.length) return 0

  return 1 + Math.max(...node.children.map((child) => getSubtreeRelativeDepth(child)));
}

function moveFailure(
  reason: WorkspaceMoveFailureReason,
  message: string,
): WorkspaceMoveFailure {
  return {
    ok: false,
    reason,
    message
  };
}

export function validateMoveItemInTree(
  tree: FileNode,
  sourcePath: string,
  targetFolderPath: string,
  maxDepth: number,
): WorkspaceMoveFailure | null {
  const sourceNode = findNodeByPath(tree, sourcePath);

  if (!sourceNode) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.SOURCE_NOT_FOUND, WORKSPACE_TREE_MESSAGES.sourceNotFound);
  }

  if (sourcePath === tree.path) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.ROOT, WORKSPACE_TREE_MESSAGES.rootMoveForbidden);
  }

  const targetNode = findNodeByPath(tree, targetFolderPath);

  if (!targetNode || targetNode.isFile) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.INVALID_TARGET, WORKSPACE_TREE_MESSAGES.invalidMoveTarget);
  }

  if (getParentPath(sourcePath) === targetFolderPath) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.SAME_LOCATION, WORKSPACE_TREE_MESSAGES.sameMoveLocation);
  }

  if (
    sourcePath === targetFolderPath ||
    targetFolderPath.startsWith(`${sourcePath}/`)
  ) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.DESCENDANT, WORKSPACE_TREE_MESSAGES.descendantMoveForbidden);
  }

  if (fileNameExistsInNode(tree, targetFolderPath, sourceNode.id)) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.DUPLICATE, WORKSPACE_TREE_MESSAGES.duplicateMove(sourceNode.id));
  }

  const deepestMovedPath = getPathDepth(targetFolderPath) + 1 + getSubtreeRelativeDepth(sourceNode);

  if (deepestMovedPath > maxDepth) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.MAX_DEPTH, WORKSPACE_TREE_MESSAGES.maxMoveDepth(maxDepth));
  }

  return null;
}

export function moveItemInTree(
  tree: FileNode,
  sourcePath: string,
  targetFolderPath: string,
  maxDepth: number,
): WorkspaceMoveResult {
  const validationError = validateMoveItemInTree(
    tree,
    sourcePath,
    targetFolderPath,
    maxDepth,
  );
  if (validationError) return validationError;

  const { tree: treeWithoutSource, extracted } = extractNodeFromTree(
    tree,
    sourcePath,
  );

  if (!extracted) {
    return moveFailure(WORKSPACE_MOVE_FAILURE_REASON.SOURCE_NOT_FOUND, WORKSPACE_TREE_MESSAGES.sourceNotFound);
  }

  const oldPath = extracted.path;
  const newPath = targetFolderPath
    ? `${targetFolderPath}/${extracted.id}`
    : extracted.id;

  const movedNode = updateNodePaths(extracted, oldPath, newPath);
  const movedTree = insertItemInFolder(
    treeWithoutSource,
    targetFolderPath,
    movedNode,
  );

  return { ok: true, movedTree, oldPath, newPath };
}

export function rebaseMovedPath(
  currentPath: string,
  oldPath: string,
  newPath: string,
): string {
  if (currentPath === oldPath) return newPath

  if (currentPath.startsWith(`${oldPath}/`)) return `${newPath}${currentPath.slice(oldPath.length)}`

  return currentPath;
}

export function renameItemInTree(
  node: FileNode,
  targetPath: string,
  newName: string,
): FileNode {
  if (node.path === targetPath) {
    const parentPath = getParentPath(targetPath);
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;

    const renamedNode: FileNode = {
      ...node,
      id: newName,
      path: newPath,
    };

    if (renamedNode.children?.length) {
      renamedNode.children = renamedNode.children.map((child) =>
        updateNodePaths(child, targetPath, newPath),
      );
    }

    return renamedNode;
  }

  if (!node.children?.length) {
    return node;
  }

  const updatedChildren = node.children.map((child) =>
    renameItemInTree(child, targetPath, newName),
  );

  const hasChanges = updatedChildren.some(
    (child, index) => child !== node.children![index],
  );

  if (!hasChanges) {
    return node;
  }

  return {
    ...node,
    children: updatedChildren,
  };
}
