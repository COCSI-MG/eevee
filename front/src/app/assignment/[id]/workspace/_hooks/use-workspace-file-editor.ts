"use client";

import React from "react";
import { FileNode, SelectedItem } from "@/types/shared";
import { getFileLanguage } from "../_utils/workspace.utils";
import {
  findNodeByPath,
  updateFileContent,
} from "../_utils/workspace-tree.utils";
import { useWorkspaceContext } from "../_providers/workspace-provider";

interface UseWorkspaceFileEditorParams {
  selectedItem: SelectedItem;
  selectItem: (item: SelectedItem) => void;
  onTreeChange?: (tree: FileNode) => void | Promise<void>;
}

export function useWorkspaceFileEditor({
  selectedItem,
  selectItem,
  onTreeChange,
}: UseWorkspaceFileEditorParams) {
  const { fileTreeData, replaceFileTree } = useWorkspaceContext();

  React.useEffect(() => {

    if (selectedItem.path) return;

    const firstFile = findFirstFile(fileTreeData);

    if (firstFile) {
      selectItem({ id: firstFile.id, type: "file", path: firstFile.path });
    }
  }, [fileTreeData, selectItem, selectedItem.path]);

  const activeFile = React.useMemo(() => {
    if (selectedItem.type !== "file" || !selectedItem.path) {
      return null;
    }

    const node = findNodeByPath(fileTreeData, selectedItem.path);

    if (!node?.isFile) return null;

    return {
      name: node.id,
      path: node.path,
      language: getFileLanguage(node.id),
      value: node.content ?? "",
    };
  }, [fileTreeData, selectedItem]);

  const handleFileSelect = React.useCallback(
    (node: FileNode) => {
      selectItem({
        id: node.id,
        type: node.isFile ? "file" : "folder",
        path: node.path,
      });
    },
    [selectItem],
  );

  const handleEditorChange = React.useCallback(
    (value: string | undefined) => {
      if (value === undefined || !activeFile?.path) return;

      const updatedTree = updateFileContent(
        fileTreeData,
        activeFile.path,
        value,
      );
      if (updatedTree === fileTreeData) return;

      replaceFileTree(updatedTree);
      void onTreeChange?.(updatedTree);
    },
    [activeFile?.path, fileTreeData, onTreeChange, replaceFileTree],
  );

  return { activeFile, handleEditorChange, handleFileSelect };
}

function findFirstFile(node: FileNode): FileNode | null {
  if (node.isFile) return node;

  for (const child of node.children ?? []) {

    const found = findFirstFile(child);

    if (found) return found;
  }
  return null;
}
