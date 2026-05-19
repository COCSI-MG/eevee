"use client";

import React from "react";
import WorkspaceCodeEditor from "./workspace-code-editor";
import WorkspaceExplorer from "./workspace-explorer";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useWorkspaceInitialization } from "../_hooks/use-workspace-initialization";
import { useActiveWorkspaceFile } from "../_hooks/use-active-workspace-file";
import { useWorkspaceTreeActions } from "../_hooks/use-workspace-tree-actions";
import { AuthSession } from "@/app/interface/scheduler-api/auth";
import { useWorkspaceReset } from "../_hooks/use-workspace-reset";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";

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
  const { replaceFileTree, selectedItem, selectItem } = useWorkspaceContext();
  const userId = user.userId;
  const { explorerWidth, startResize } = useWorskpaceResizing();

  const {
    activeFile,
    handleEditorChange,
    handleFileSelect,
    setActiveFileContent,
  } = useActiveWorkspaceFile({
    assignment,
    user,
    selectedItem,
    selectItem,
  });

  const { handleTreeChange } = useWorkspaceTreeActions({
    assignment,
    user,
  });

  const { isResetting, resetWorkspace } = useWorkspaceReset({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });

  useWorkspaceInitialization({
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
    <div className="flex flex-1 min-h-0">
      <div
        className="relative shrink-0 min-w-[150px] max-w-[400px] bg-gray-800 border-r border-gray-700 h-full min-h-0"
        style={{ width: explorerWidth }}
      >
        <WorkspaceExplorer
          onFileSelect={handleFileSelect}
          onTreeChange={handleTreeChange}
        />

        <div
          role="separator"
          aria-label="Resize explorer"
          aria-orientation="vertical"
          className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent transition-colors hover:bg-blue-500/40"
          onMouseDown={(event) => startResize("explorer", event)}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <WorkspaceCodeEditor
          file={activeFile}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
