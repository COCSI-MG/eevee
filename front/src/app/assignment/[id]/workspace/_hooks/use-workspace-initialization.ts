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
  ensureAssignmentReadme,
  shouldRebuildWorkspaceTree,
} from "../_utils/workspace.utils";

interface UseWorkspaceInitializationParams {
  assignment: Assignment;
  userId: number;
  setActiveFileContent: React.Dispatch<React.SetStateAction<string>>;
  replaceFileTree: (fileTree: FileNode) => void;
  selectItem: (item: SelectedItem) => void;
  enabled?: boolean;
}

export function useWorkspaceInitialization({
  assignment,
  userId,
  setActiveFileContent,
  replaceFileTree,
  selectItem,
  enabled = true
}: UseWorkspaceInitializationParams) {
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const [isInitialized, setIsInitialized] = React.useState(false);

  const workspaceAssignment = React.useMemo(
    () =>
      ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        workerType: assignment.workerType,
        boilerplate: assignment.boilerplate,
        boilerplateContent: assignment.boilerplateContent,
      }) as Assignment,
    [
      assignment.description,
      assignment.boilerplate,
      assignment.boilerplateContent,
      assignment.id,
      assignment.title,
      assignment.workerType,
    ],
  );

  const initializationKey = React.useMemo(() => {
    if (!workspaceAssignment.id || !userId) {
      return null;
    }

    return `${workspaceAssignment.id}:${userId}`;
  }, [userId, workspaceAssignment.id]);

  const initializedWorkspaceKeyRef = React.useRef<string | null>(null);

  const initializeWorkspace = React.useCallback(async () => {
    if (!enabled || !initializationKey) {
      return;
    }

    if (initializedWorkspaceKeyRef.current === initializationKey) {
      return;
    }

    initializedWorkspaceKeyRef.current = initializationKey;
    setIsInitialized(false);

    let fileTree: FileNode | null = null;
    let shouldPersistInitialState = false;

    try {
      fileTree = await getFileTree(workspaceAssignment.id, userId);
    } catch (error) {
      initializedWorkspaceKeyRef.current = null;
      console.error("Error loading workspace tree from Filestash:", error);
      return;
    }

    if (
      !fileTree ||
      shouldRebuildWorkspaceTree(workspaceAssignment, fileTree)
    ) {
      fileTree = createInitialWorkspaceTree(workspaceAssignment);
      shouldPersistInitialState = true;
    } else {
      const fileTreeWithReadme = ensureAssignmentReadme(
        fileTree,
        workspaceAssignment,
      );

      if (fileTreeWithReadme !== fileTree) {
        fileTree = fileTreeWithReadme;
        shouldPersistInitialState = true;
      }
    }

    replaceFileTree(fileTree);

    const firstFile = findFirstFile(fileTree);
    if (firstFile) {
      const firstFileContent =
        firstFile.content ?? getAssignmentBoilerplate(workspaceAssignment);

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
        assignmentId: workspaceAssignment.id,
        userId,
        fileTree,
      });
    }

    setIsInitialized(true);
  }, [
    enabled,
    initializationKey,
    replaceFileTree,
    saveFileTreeAsync,
    selectItem,
    setActiveFileContent,
    workspaceAssignment,
    userId,
  ]);

  React.useEffect(() => {
    void initializeWorkspace();
  }, [initializeWorkspace]);

  return { isInitialized };
}
