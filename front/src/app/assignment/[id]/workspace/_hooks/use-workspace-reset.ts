"use client";

import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { toast } from "@/hooks/use-toast";
import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import {
  createInitialWorkspaceTree,
  findFirstFile,
  getAssignmentBoilerplate,
} from "../_utils/workspace.utils";

interface UseWorkspaceResetParams {
  assignment: Assignment;
  userId: number;
  setActiveFileContent: React.Dispatch<React.SetStateAction<string>>;
  replaceFileTree: (fileTree: FileNode) => void;
  selectItem: (item: SelectedItem) => void;
}

export function useWorkspaceReset({
  assignment,
  userId,
  setActiveFileContent,
  replaceFileTree,
  selectItem,
}: UseWorkspaceResetParams) {
  const { mutateAsync: saveFileTreeAsync, isPending: isResetting } =
    useSaveFileTree();

  const resetWorkspace = React.useCallback(
    async (nextAssignment?: Assignment) => {
      const assignmentToReset = nextAssignment ?? assignment;
      const fileTree = createInitialWorkspaceTree(assignmentToReset);
      const firstFile = findFirstFile(fileTree);

      if (firstFile) {
        const firstFileContent =
          firstFile.content ?? getAssignmentBoilerplate(assignmentToReset);

        firstFile.content = firstFileContent;

        selectItem({
          id: firstFile.id,
          type: "file",
          path: firstFile.path,
        });
        setActiveFileContent(firstFileContent);
      } else {
        setActiveFileContent("");
      }

      replaceFileTree(fileTree);

      await saveFileTreeAsync({
        assignmentId: assignmentToReset.id,
        userId,
        fileTree,
      });

      toast({
        title: "Workspace limpo",
        description: "O boilerplate inicial foi restaurado.",
      });
    },
    [
      assignment,
      replaceFileTree,
      saveFileTreeAsync,
      selectItem,
      setActiveFileContent,
      userId,
    ],
  );

  return {
    isResetting,
    resetWorkspace,
  };
}
