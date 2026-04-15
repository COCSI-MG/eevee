"use client";

import React from "react";
import { FileNode } from "@/types/shared";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import {
  addItemToTree,
  countFiles,
  findNodeByPath,
  getBaseName,
  getParentPath,
  getPathDepth,
  getWorkspaceCreateTargetLabel,
  getWorkspaceCreateTargetPath,
  moveItemInTree,
  removeItemFromTree,
  renameItemInTree,
  validateCreateWorkspaceItem,
  validateRenameWorkspaceItem,
  WorkspaceItemType,
} from "../_utils/workspace-tree.utils";

interface UseWorkspaceExplorerParams {
  onTreeChange: (newTree: FileNode) => void | Promise<void>;
  maxDepth: number;
  maxFiles: number;
}

export function useWorkspaceExplorer({
  onTreeChange,
  maxDepth,
  maxFiles,
}: UseWorkspaceExplorerParams) {
  const { selectedItem, selectItem, clearSelection, fileTreeData: treeData } =
    useWorkspaceContext();

  const [newItemName, setNewItemName] = React.useState("");
  const [newItemType, setNewItemType] =
    React.useState<WorkspaceItemType>("file");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameTargetPath, setRenameTargetPath] = React.useState("");
  const [deleteTargetPath, setDeleteTargetPath] = React.useState("");
  const [draggedNodePath, setDraggedNodePath] = React.useState("");
  const [error, setError] = React.useState("");

  const treeInfo = React.useMemo(() => {
    if (!treeData) {
      return { fileCount: 0, maxDepthReached: 0 };
    }

    return {
      fileCount: countFiles(treeData),
      maxDepthReached: getPathDepth(selectedItem.path),
    };
  }, [selectedItem.path, treeData]);

  const hasSelection = Boolean(selectedItem.path);
  const createTargetPath = getWorkspaceCreateTargetPath(selectedItem, treeData);
  const createTargetLabel = getWorkspaceCreateTargetLabel(
    selectedItem,
    treeData,
  );
  const deleteTargetLabel = React.useMemo(() => {
    const node = treeData ? findNodeByPath(treeData, deleteTargetPath) : null;
    return node?.id || getBaseName(deleteTargetPath);
  }, [deleteTargetPath, treeData]);

  const openCreateItemDialog = React.useCallback((itemType: WorkspaceItemType) => {
    setNewItemType(itemType);
    setError("");
    setIsCreateDialogOpen(true);
  }, []);

  const closeCreateDialog = React.useCallback(() => {
    setIsCreateDialogOpen(false);
    setError("");
  }, []);

  const resetCreateDialog = React.useCallback(() => {
    setNewItemName("");
    setError("");
    setIsCreateDialogOpen(false);
  }, []);

  const closeDeleteDialog = React.useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const resetDeleteDialog = React.useCallback(() => {
    setDeleteTargetPath("");
    setIsDeleteDialogOpen(false);
  }, []);

  const closeRenameDialog = React.useCallback(() => {
    setIsRenameDialogOpen(false);
    setRenameTargetPath("");
    setRenameValue("");
    setError("");
  }, []);

  const handleCreateItem = React.useCallback(() => {
    const validationError = validateCreateWorkspaceItem({
      name: newItemName,
      targetPath: createTargetPath,
      itemType: newItemType,
      treeData,
      maxDepth,
      maxFiles,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!treeData) {
      return;
    }

    const newItemPath = createTargetPath
      ? `${createTargetPath}/${newItemName}`
      : newItemName;

    const newItem: FileNode = {
      id: newItemName,
      isSelectable: true,
      isFile: newItemType === "file",
      path: newItemPath,
    };

    if (newItemType === "folder") {
      newItem.children = [];
    }

    const updatedTree = addItemToTree(treeData, createTargetPath, newItem);
    void onTreeChange(updatedTree);

    resetCreateDialog();
  }, [
    createTargetPath,
    maxDepth,
    maxFiles,
    newItemName,
    newItemType,
    onTreeChange,
    resetCreateDialog,
    treeData,
  ]);

  const handleDeleteRequest = React.useCallback(
    (node?: FileNode) => {
      if (!treeData) return;

      const targetNode = node ?? findNodeByPath(treeData, selectedItem.path);
      if (!targetNode) return;

      selectItem({
        id: targetNode.id,
        type: targetNode.isFile ? "file" : "folder",
        path: targetNode.path,
      });
      setDeleteTargetPath(targetNode.path);
      setIsDeleteDialogOpen(true);
    },
    [selectItem, selectedItem.path, treeData],
  );

  const handleRenameRequest = React.useCallback(
    (node: FileNode) => {
      selectItem({
        id: node.id,
        type: node.isFile ? "file" : "folder",
        path: node.path,
      });
      setRenameTargetPath(node.path);
      setRenameValue(node.id);
      setError("");
      setIsRenameDialogOpen(true);
    },
    [selectItem],
  );

  const handleRename = React.useCallback(() => {
    if (!treeData || !renameTargetPath) return;

    const validationError = validateRenameWorkspaceItem({
      treeData,
      targetPath: renameTargetPath,
      newName: renameValue,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    const targetNode = findNodeByPath(treeData, renameTargetPath);
    if (!targetNode) return;

    const trimmedName = renameValue.trim();
    const oldPath = targetNode.path;
    const parentPath = getParentPath(renameTargetPath);
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    const updatedTree = renameItemInTree(treeData, renameTargetPath, trimmedName);

    void onTreeChange(updatedTree);

    if (selectedItem.path === oldPath) {
      selectItem({
        id: trimmedName,
        type: targetNode.isFile ? "file" : "folder",
        path: newPath,
      });
    } else if (selectedItem.path.startsWith(`${oldPath}/`)) {
      const updatedPath = `${newPath}${selectedItem.path.slice(oldPath.length)}`;
      selectItem({
        ...selectedItem,
        id: getBaseName(updatedPath),
        path: updatedPath,
      });
    }

    closeRenameDialog();
  }, [
    closeRenameDialog,
    onTreeChange,
    renameTargetPath,
    renameValue,
    selectItem,
    selectedItem,
    treeData,
  ]);

  const handleDeleteConfirm = React.useCallback(() => {
    if (!treeData || !deleteTargetPath) return;

    const updatedTree = removeItemFromTree(treeData, deleteTargetPath);
    void onTreeChange(updatedTree);

    if (
      selectedItem.path === deleteTargetPath ||
      selectedItem.path.startsWith(`${deleteTargetPath}/`)
    ) {
      clearSelection();
    }

    resetDeleteDialog();
  }, [
    clearSelection,
    deleteTargetPath,
    onTreeChange,
    resetDeleteDialog,
    selectedItem.path,
    treeData,
  ]);

  const handleDragStart = React.useCallback(
    (event: React.DragEvent, node: FileNode) => {
      event.dataTransfer.setData("text/plain", node.path);
      event.dataTransfer.effectAllowed = "move";
      setDraggedNodePath(node.path);
    },
    [],
  );

  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragLeave = React.useCallback(() => {
    // visual feedback handled inside tree item component
  }, []);

  const handleDrop = React.useCallback(
    (event: React.DragEvent, targetNode: FileNode) => {
      event.preventDefault();

      if (!treeData) {
        setDraggedNodePath("");
        return;
      }

      const sourcePath = event.dataTransfer.getData("text/plain") || draggedNodePath;
      if (!sourcePath) {
        setDraggedNodePath("");
        return;
      }

      const targetFolderPath = targetNode.isFile
        ? getParentPath(targetNode.path)
        : targetNode.path;

      const moveResult = moveItemInTree(treeData, sourcePath, targetFolderPath);
      if (!moveResult) {
        setDraggedNodePath("");
        return;
      }

      const { movedTree, oldPath, newPath } = moveResult;
      void onTreeChange(movedTree);

      if (selectedItem.path === oldPath) {
        selectItem({
          ...selectedItem,
          path: newPath,
          id: getBaseName(newPath),
        });
      } else if (selectedItem.path.startsWith(`${oldPath}/`)) {
        const updatedPath = `${newPath}${selectedItem.path.slice(oldPath.length)}`;
        selectItem({
          ...selectedItem,
          path: updatedPath,
          id: getBaseName(updatedPath),
        });
      }

      setDraggedNodePath("");
    },
    [draggedNodePath, onTreeChange, selectItem, selectedItem, treeData],
  );

  return {
    selectedItem,
    treeData,
    treeInfo,
    hasSelection,
    createTargetLabel,
    deleteTargetLabel,
    selectItem,
    clearSelection,
    newItemName,
    setNewItemName,
    newItemType,
    isCreateDialogOpen,
    isDeleteDialogOpen,
    isRenameDialogOpen,
    renameValue,
    setRenameValue,
    error,
    setError,
    openCreateItemDialog,
    closeCreateDialog,
    resetCreateDialog,
    closeDeleteDialog,
    resetDeleteDialog,
    closeRenameDialog,
    handleCreateItem,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleRenameRequest,
    handleRename,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setIsCreateDialogOpen,
    setIsDeleteDialogOpen,
    setIsRenameDialogOpen,
  };
}
