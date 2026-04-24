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

export function useActiveWorkspaceFile({
  assignment,
  user,
  selectedItem,
  selectItem,
}: UseActiveWorkspaceFileParams) {
  const { fileTreeData, replaceFileTree } = useWorkspaceContext();
  const [activeFileContent, setActiveFileContent] = React.useState("");
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();

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
      selectedItem.type !== "file" ||
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
          type: "file",
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

  const handleEditorChange = React.useCallback(
    (value: string | undefined) => {
      if (value === undefined || !activeFile?.path) {
        return;
      }

      setActiveFileContent(value);

      const updatedTree = buildUpdatedTree(fileTreeData, activeFile.path, value);
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
