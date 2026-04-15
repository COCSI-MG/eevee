"use client";

import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { User } from "@/app/interface/scheduler-api/user";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { FileNode } from "@/types/shared";
import React from "react";
import { useWorkspaceContext } from "../_providers/workspace-provider";

interface UseWorkspaceTreeActionsParams {
  assignment: Assignment;
  user: Pick<User, "id" | "email" | "isAdmin">;
}

export function useWorkspaceTreeActions({
  assignment,
  user,
}: UseWorkspaceTreeActionsParams) {
  const { replaceFileTree } = useWorkspaceContext();
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();

  const handleTreeChange = React.useCallback(
    async (newTree: FileNode) => {
      if (assignment.id && user.id) {
        console.log("Saving updated file tree");
        replaceFileTree(newTree);
        await saveFileTreeAsync({
          assignmentId: assignment.id,
          userId: user.id,
          fileTree: newTree,
        });
      }
    },
    [assignment.id, replaceFileTree, saveFileTreeAsync, user.id],
  );

  return {
    handleTreeChange,
  };
}
