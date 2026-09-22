"use client";

import React from "react";
import WorkspaceExplorer from "./workspace-explorer";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useWorkspaceFileEditor } from "../_hooks/use-workspace-file-editor";
import { useWorkspaceTreeActions } from "../_hooks/use-workspace-tree-actions";
import { useWorkspaceInitialization } from "../_hooks/use-workspace-initialization";
import { AuthSession } from "@/app/interface/scheduler-api/auth";
import { useWorkspaceReset } from "../_hooks/use-workspace-reset";
import { FileNode, SelectedItem } from "@/types/shared";
import {
  updateFileContent,
  findNodeByPath,
  rebaseMovedPath,
} from "../_utils/workspace-tree.utils";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { EDITOR_ACTION_GUARD_MODE } from "@/constants/editor-action-guard";
import WorkspaceImportControl from "./workspace-import-control";
import WorkspaceShell from "./workspace-shell";

interface WorkspaceProps {
  assignment: Assignment;
  user: AuthSession;
  onResetWorkspaceReady?: (
    resetWorkspace: ((assignment?: Assignment) => Promise<void>) | null,
  ) => void;
  onResettingChange?: (isResetting: boolean) => void;
}

export default function Workspace({
  assignment,
  user,
  onResetWorkspaceReady,
  onResettingChange,
}: WorkspaceProps) {
  const {
    replaceFileTree,
    selectedItem,
    selectItem,
    fileTreeData,
    securityPaused,
    registerTypedText
  } = useWorkspaceContext();
  const userId = user.userId;
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const [, setActiveFileContent] = React.useState("");
  const [secondarySelectedItem, setSecondarySelectedItem] =
    React.useState<SelectedItem | null>(null);

  useWorkspaceInitialization({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });

  const editorActionGuardMode = user.isAdmin
    ? EDITOR_ACTION_GUARD_MODE.EXEMPT
    : assignment.allowCopyPaste
      ? EDITOR_ACTION_GUARD_MODE.INTERNAL_ONLY
      : EDITOR_ACTION_GUARD_MODE.ENFORCED;

  const { activeFile, handleEditorChange, handleFileSelect } =
    useWorkspaceFileEditor({
      selectedItem,
      selectItem,
      onTreeChange: async (tree) => {
        await saveFileTreeAsync({
          assignmentId: assignment.id,
          userId: user.userId,
          fileTree: tree,
        });
      },
    });

  const { handleTreeChange } = useWorkspaceTreeActions({
    assignment,
    user,
  });

  const secondaryFile = React.useMemo(() => {
    if (!secondarySelectedItem?.path || secondarySelectedItem.type !== "file") {
      return null;
    }

    const fileNode = findNodeByPath(fileTreeData, secondarySelectedItem.path);
    if (!fileNode || !fileNode.isFile) {
      return null;
    }

    return {
      name: fileNode.id,
      path: fileNode.path,
      language: fileNode.id.split(".").pop() || "",
      value: fileNode.content || "",
    };
  }, [fileTreeData, secondarySelectedItem]);

  const handleSecondaryEditorChange = React.useCallback(
    (value: string | undefined) => {
      if (value === undefined || !secondaryFile?.path) {
        return;
      }

      const updatedTree = updateFileContent(
        fileTreeData,
        secondaryFile.path,
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
      assignment.id,
      fileTreeData,
      replaceFileTree,
      saveFileTreeAsync,
      secondaryFile?.path,
      user.userId,
    ],
  );

  const handleOpenInSecondary = React.useCallback((node: FileNode) => {
    if (!node.isFile) {
      return;
    }

    setSecondarySelectedItem({
      id: node.id,
      type: "file",
      path: node.path,
    });
  }, []);

  const handleItemMoved = React.useCallback(
    (oldPath: string, newPath: string) => {
      setSecondarySelectedItem((current) => {
        if (!current) return current;
        const updatedPath = rebaseMovedPath(current.path, oldPath, newPath);
        if (updatedPath === current.path) return current;
        return {
          ...current,
          id: updatedPath.split("/").pop() || current.id,
          path: updatedPath,
        };
      });
    },
    [],
  );

  React.useEffect(() => {
    if (!secondarySelectedItem?.path) {
      return;
    }

    const exists = Boolean(
      findNodeByPath(fileTreeData, secondarySelectedItem.path),
    );
    if (!exists) {
      setSecondarySelectedItem(null);
    }
  }, [fileTreeData, secondarySelectedItem]);

  const { isResetting, resetWorkspace } = useWorkspaceReset({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });

  React.useEffect(() => {
    onResetWorkspaceReady?.(resetWorkspace);

    return () => {
      onResetWorkspaceReady?.(null);
    };
  }, [onResetWorkspaceReady, resetWorkspace]);

  React.useEffect(() => {
    onResettingChange?.(isResetting);
  }, [isResetting, onResettingChange]);

  return (
    <WorkspaceShell
      explorer={
        <>
          <WorkspaceImportControl
            assignment={assignment}
            user={user}
          />

          <WorkspaceExplorer
            onFileSelect={handleFileSelect}
            onTreeChange={handleTreeChange}
            onOpenInSecondary={handleOpenInSecondary}
            onItemMoved={handleItemMoved}
          />
        </>
      }
      activeFile={activeFile}
      secondaryFile={secondaryFile}
      onEditorChange={handleEditorChange}
      onSecondaryEditorChange={handleSecondaryEditorChange}
      editorActionGuardMode={editorActionGuardMode}
    />
  );
}
