"use client";

import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { AuthSession } from "@/app/interface/scheduler-api/auth";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { FileNode } from "@/types/shared";
import React from "react";
import { useWorkspaceContext } from "../_providers/workspace-provider";

interface UseWorkspaceTreeActionsParams {
  assignment: Assignment;
  user: AuthSession;
}

export function useWorkspaceTreeActions({
  assignment,
  user,
}: UseWorkspaceTreeActionsParams) {
  const { replaceFileTree } = useWorkspaceContext();
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();

  const handleTreeChange = React.useCallback(
    async (newTree: FileNode) => {
      if (assignment.id && user.userId) {
        console.log("Saving updated file tree");
        replaceFileTree(newTree);
        await saveFileTreeAsync({
          assignmentId: assignment.id,
          userId: user.userId,
          fileTree: newTree,
        });
      }
    },
    [assignment.id, replaceFileTree, saveFileTreeAsync, user.userId],
  );

  return {
    handleTreeChange,
  };
}
