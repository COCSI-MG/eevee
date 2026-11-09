"use client";

import {
  getFileTreeSnapshot,
  compareAndReplaceFileTree,
  type LocalWorkspaceSnapshot,
} from "@/app/integration/filestash";
import { Assignment } from "@/app/interface/platform-api/assignment";
import { toast } from "@/hooks/use-toast";
import {
  downloadStorageWorkspace,
  rememberStorageWorkspace,
  type StorageWorkspace,
} from "@/app/integration/file-storage-api/source-storage";
import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import {
  createInitialWorkspaceTree,
  findFirstFile,
  getAssignmentBoilerplate,
  ensureAssignmentReadme,
} from "../_utils/workspace.utils";
import { flattenFileTreeToSchedulingFiles } from "../_utils/workspace-scheduling.utils";
import { treeFromStorageFiles } from "../_utils/workspace-tree.utils";

interface WorkspaceFileDifference {
  path: string;
  browserContent?: string;
  serverContent?: string;
}

type WorkspaceVersionChoice = "browser" | "server" | "cancel";

export interface WorkspaceVersionConflict {
  files: WorkspaceFileDifference[];
  choose: (version: WorkspaceVersionChoice) => void;
}

function compareWorkspaceFiles(
  browser: Record<string, string>,
  server: Record<string, string>,
): WorkspaceFileDifference[] {
  const paths = new Set([...Object.keys(browser), ...Object.keys(server)]);
  return [...paths].sort().flatMap((path) => {
    const browserContent = Object.hasOwn(browser, path) ? browser[path] : undefined;
    const serverContent = Object.hasOwn(server, path) ? server[path] : undefined;
    return browserContent === serverContent
      ? []
      : [{ path, browserContent, serverContent }];
  });
}

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
  const [initializedKey, setInitializedKey] = React.useState<string | null>(
    null,
  );
  const [conflict, setConflict] = React.useState<
    (WorkspaceVersionConflict & { workspaceKey: string }) | null
  >(null);

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

  const initializeWorkspace = React.useCallback(
    async (signal: AbortSignal) => {
      const isCurrent = () => !signal.aborted;
      if (!initializationKey) {
        return;
      }

      if (initializedWorkspaceKeyRef.current === initializationKey) {
        return;
      }

      setInitializedKey(null);

      let remote: StorageWorkspace | undefined;
      try {
        remote = await downloadStorageWorkspace(workspaceAssignment.id, { userId });
      } catch (error) {
        if (!isCurrent()) return;
        console.warn(
          "Não foi possível verificar a versão remota do workspace:",
          error,
        );
      }
      if (!isCurrent()) return;

      // Read after the download so changes saved by another tab are included.
      let localSnapshot: LocalWorkspaceSnapshot;
      try {
        localSnapshot = await getFileTreeSnapshot(workspaceAssignment.id, userId);
      } catch (error) {
        if (!isCurrent()) return;
        initializedWorkspaceKeyRef.current = null;
        console.error("Error loading workspace tree from Filestash:", error);
        return;
      }
      if (!isCurrent()) return;

      let fileTree = localSnapshot.fileTree
        ? ensureAssignmentReadme(
            JSON.parse(JSON.stringify(localSnapshot.fileTree)),
            workspaceAssignment,
          )
        : createInitialWorkspaceTree(workspaceAssignment);
      let acceptedRemote: StorageWorkspace | undefined;
      if (remote) {
        const local = flattenFileTreeToSchedulingFiles(fileTree, Object.create(null));
        const differences = compareWorkspaceFiles(local, remote.files);
        if (remote.revision > 0 && differences.length > 0) {
          const choice = localSnapshot.fileTree
            ? await new Promise<WorkspaceVersionChoice>((resolve) => {
              const cancel = () => resolve("cancel");
              signal.addEventListener("abort", cancel, { once: true });
              setConflict({
                workspaceKey: initializationKey,
                files: differences,
                choose: (version) => {
                  if (!isCurrent()) return;
                  signal.removeEventListener("abort", cancel);
                  setConflict(null);
                  resolve(version);
                },
              });
            })
            : "server";
          if (!isCurrent()) return;
          if (choice === "server") {
            fileTree = treeFromStorageFiles(remote.files);
          }
          if (choice !== "cancel") acceptedRemote = remote;
        } else {
          acceptedRemote = remote;
        }
      }

      const firstFile = findFirstFile(fileTree);
      if (firstFile && firstFile.content === undefined) {
        firstFile.content = getAssignmentBoilerplate(workspaceAssignment);
      }

      // Consent applies to exactly the local revision that was displayed.
      try {
        const result = await compareAndReplaceFileTree(
          workspaceAssignment.id,
          userId,
          localSnapshot,
          fileTree,
          isCurrent,
        );
        if (!isCurrent()) return;
        if (!result.applied) {
          acceptedRemote = undefined;
          if (!result.snapshot.fileTree) return;
          fileTree = result.snapshot.fileTree;
          toast({
            title: "Arquivos alterados em outra aba",
            description:
              "As edições mais recentes foram preservadas. A versão do servidor não foi aplicada.",
          });
        }
      } catch (error) {
        if (isCurrent())
          console.error("Não foi possível salvar o workspace local:", error);
        return;
      }

      if (!isCurrent()) return;
      if (acceptedRemote) rememberStorageWorkspace(acceptedRemote);
      replaceFileTree(fileTree);
      const selectedFile = findFirstFile(fileTree);
      if (selectedFile) {
        selectItem({
          id: selectedFile.id,
          type: "file",
          path: selectedFile.path,
        });
        setActiveFileContent(
          selectedFile.content ?? getAssignmentBoilerplate(workspaceAssignment),
        );
      }

      if (!isCurrent()) return;
      initializedWorkspaceKeyRef.current = initializationKey;
      setInitializedKey(initializationKey);
    },
    [
      initializationKey,
      replaceFileTree,
      selectItem,
      setActiveFileContent,
      workspaceAssignment,
      userId,
    ],
  );

  React.useEffect(() => {
    const controller = new AbortController();
    setConflict(null);
    void initializeWorkspace(controller.signal);
    return () => controller.abort();
  }, [initializeWorkspace]);

  return {
    conflict: conflict?.workspaceKey === initializationKey ? conflict : null,
    isInitialized:
      initializationKey !== null && initializedKey === initializationKey,
  };
}
