"use client";

import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import { AuthSession } from "@/app/interface/scheduler-api/auth";
import { getFileLanguage } from "../_utils/workspace.utils";
import { useWorkspaceContext } from "../_providers/workspace-provider";

interface UseActiveWorkspaceFileParams {
  assignment: Assignment;
  user: AuthSession;
  selectedItem: SelectedItem;
  selectItem: (item: SelectedItem) => void;
}

const FILE_ITEM_TYPE: SelectedItem["type"] = "file";

export function useActiveWorkspaceFile({
  assignment,
  user,
  selectedItem,
  selectItem,
}: UseActiveWorkspaceFileParams) {
  const { fileTreeData, replaceFileTree } = useWorkspaceContext();
  const [activeFileContent, setActiveFileContent] = React.useState("");
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();

  const findNodeByPath = React.useCallback(
    (node: FileNode, filePath: string): FileNode | null => {
      if (node.path === filePath) {
        return node;
      }

      if (!node.children?.length) {
        return null;
      }

      for (const child of node.children) {
        const found = findNodeByPath(child, filePath);
        if (found) {
          return found;
        }
      }

      return null;
    },
    [],
  );

  const buildUpdatedTree = React.useCallback(
    (node: FileNode, filePath: string, content: string): FileNode => {
      if (node.path === filePath && node.isFile) {
        return {
          ...node,
          content,
          updatedAt: new Date().toISOString(),
        };
      }

      if (!node.children?.length) {
        return node;
      }

      const updatedChildren = node.children.map((child) =>
        buildUpdatedTree(child, filePath, content),
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
    },
    [],
  );

  const activeFile = React.useMemo(() => {
    if (
      selectedItem.type !== FILE_ITEM_TYPE ||
      !selectedItem.path ||
      !selectedItem.id
    ) {
      return null;
    }

    return {
      name: selectedItem.id,
      path: selectedItem.path,
      language: getFileLanguage(selectedItem.id),
      value: activeFileContent,
    };
  }, [
    activeFileContent,
    selectedItem.id,
    selectedItem.path,
    selectedItem.type,
  ]);

  const handleFileSelect = React.useCallback(
    (node: FileNode) => {
      if (node.isFile) {
        selectItem({
          id: node.id,
          type: FILE_ITEM_TYPE,
          path: node.path,
        });

        setActiveFileContent(node.content || "");
        return;
      }

      selectItem({
        id: node.id,
        type: "folder",
        path: node.path,
      });
    },
    [selectItem],
  );

  React.useEffect(() => {
    if (selectedItem.type !== FILE_ITEM_TYPE || !selectedItem.path) {
      return;
    }

    const selectedNode = findNodeByPath(fileTreeData, selectedItem.path);
    if (!selectedNode || !selectedNode.isFile) {
      return;
    }

    setActiveFileContent(selectedNode.content || "");
  }, [fileTreeData, findNodeByPath, selectedItem.path, selectedItem.type]);

  const handleEditorChange = React.useCallback(
    (value: string | undefined) => {
      if (value === undefined || !activeFile?.path) {
        return;
      }

      setActiveFileContent(value);

      const updatedTree = buildUpdatedTree(
        fileTreeData,
        activeFile.path,
        value,
      );
      if (updatedTree === fileTreeData) {
        return;
      }

      replaceFileTree(updatedTree);

      void saveFileTreeAsync({
        assignmentId: assignment.id,
        userId: user.userId,
        fileTree: updatedTree,
      });
    },
    [
      activeFile?.path,
      assignment.id,
      buildUpdatedTree,
      fileTreeData,
      replaceFileTree,
      saveFileTreeAsync,
      user.userId,
    ],
  );

  return {
    activeFile,
    handleEditorChange,
    handleFileSelect,
    setActiveFileContent,
  };
}
