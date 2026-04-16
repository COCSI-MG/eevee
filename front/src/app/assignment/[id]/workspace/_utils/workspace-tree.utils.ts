import { FileNode, SelectedItem } from "@/types/shared";

export type WorkspaceItemType = "file" | "folder";

const INVALID_NAME_PATTERN = /[<>:"/\\|?*\x00-\x1F]/;

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
    return "Name cannot be empty";
  }

  if (INVALID_NAME_PATTERN.test(name)) {
    return "Name contains invalid characters";
  }

  return null;
}

export function getWorkspaceCreateTargetPath(
  selectedItem: SelectedItem,
  treeData: FileNode | null,
): string {
  if (selectedItem.type === "folder" && selectedItem.path) {
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
  if (selectedItem.type === "folder" && selectedItem.id) {
    return selectedItem.id;
  }

  const targetPath = getWorkspaceCreateTargetPath(selectedItem, treeData);
  return targetPath || "root";
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
    return "An item with this name already exists in the target location";
  }

  if (getPathDepth(targetPath) + 1 > maxDepth) {
    return `Maximum depth of ${maxDepth} levels reached. Cannot create items deeper.`;
  }

  if (itemType === "file" && countFiles(treeData) >= maxFiles) {
    return `Maximum of ${maxFiles} files reached. Delete some files first.`;
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
    return "Item not found";
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
    return "An item with this name already exists in the target location";
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

export function moveItemInTree(
  tree: FileNode,
  sourcePath: string,
  targetFolderPath: string,
): { movedTree: FileNode; oldPath: string; newPath: string } | null {
  if (sourcePath === targetFolderPath) {
    return null;
  }

  if (targetFolderPath.startsWith(`${sourcePath}/`)) {
    return null;
  }

  const { tree: treeWithoutSource, extracted } = extractNodeFromTree(
    tree,
    sourcePath,
  );

  if (!extracted) {
    return null;
  }

  if (fileNameExistsInNode(treeWithoutSource, targetFolderPath, extracted.id)) {
    return null;
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

  return { movedTree, oldPath, newPath };
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
