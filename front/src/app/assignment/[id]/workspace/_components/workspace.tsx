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

interface WorkspaceProps {
  assignment: Assignment;
  user: AuthSession;
}

export default function Workspace({ assignment, user }: WorkspaceProps) {
  const { replaceFileTree, selectedItem, selectItem } = useWorkspaceContext();
  const userId = user.userId;

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

  useWorkspaceInitialization({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });

  return (
    <div className="flex flex-1 min-h-0">
      <WorkspaceExplorer
        onFileSelect={handleFileSelect}
        onTreeChange={handleTreeChange}
      />

      <div className="flex-1 flex flex-col">
        <WorkspaceCodeEditor
          file={activeFile}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
