"use client";

import { getFileTree } from "@/app/integration/filestash";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import {
  createInitialWorkspaceTree,
  findFirstFile,
  getAssignmentBoilerplate,
  shouldRebuildWorkspaceTree,
} from "../_utils/workspace.utils";

interface UseWorkspaceInitializationParams {
  assignment: Assignment;
  userId: number;
  setActiveFileContent: React.Dispatch<React.SetStateAction<string>>;
  replaceFileTree: (fileTree: FileNode) => void;
  selectItem: (item: SelectedItem) => void;
}

export function useWorkspaceInitialization({
  assignment,
  userId,
  setActiveFileContent,
  replaceFileTree,
  selectItem,
}: UseWorkspaceInitializationParams) {
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();

  const initializeWorkspace = React.useCallback(async () => {
    let fileTree = await getFileTree(assignment.id, userId);
    let shouldPersistInitialState = false;

    if (!fileTree || shouldRebuildWorkspaceTree(assignment, fileTree)) {
      fileTree = createInitialWorkspaceTree(assignment);
      shouldPersistInitialState = true;
    }

    replaceFileTree(fileTree);

    const firstFile = findFirstFile(fileTree);
    if (firstFile) {
      const firstFileContent =
        firstFile.content ?? getAssignmentBoilerplate(assignment);

      selectItem({
        id: firstFile.id,
        type: "file",
        path: firstFile.path,
      });

      setActiveFileContent(firstFileContent);

      if (firstFile.content === undefined) {
        firstFile.content = firstFileContent;
        shouldPersistInitialState = true;
      }
    }

    if (shouldPersistInitialState) {
      await saveFileTreeAsync({
        assignmentId: assignment.id,
        userId,
        fileTree,
      });
    }
  }, [
    assignment,
    replaceFileTree,
    saveFileTreeAsync,
    selectItem,
    setActiveFileContent,
    userId,
  ]);

  React.useEffect(() => {
    void initializeWorkspace();
  }, [initializeWorkspace]);
}
