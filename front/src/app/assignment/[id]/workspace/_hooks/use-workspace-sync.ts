"use client";

import { useEffect, useRef, useState } from "react";
import { createStorageWorkspaceSync, type StorageDraft } from "@/app/integration/file-storage-api/source-storage";
import { FileNode } from "@/types/shared";
import { flattenFileTreeToSchedulingFiles } from "../_utils/workspace-scheduling.utils";

export function useWorkspaceSync(
  assignmentId: number,
  userId: number,
  tree: FileNode,
  initialized: boolean,
  draft: StorageDraft = "workspace",
) {
  const [status, setStatus] = useState<
    "pending" | "saving" | "saved" | "error"
  >("pending");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const syncWorkspace = useRef<ReturnType<typeof createStorageWorkspaceSync> | null>(
    null,
  );
  const retry = () => setRetryCount((value) => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    syncWorkspace.current = createStorageWorkspaceSync(
      assignmentId,
      userId,
      controller.signal,
      draft,
    );
    const online = () => setRetryCount((value) => value + 1);
    window.addEventListener("online", online);
    return () => {
      controller.abort();
      syncWorkspace.current = null;
      window.removeEventListener("online", online);
    };
  }, [assignmentId, userId, draft]);

  useEffect(() => {
    const sync = syncWorkspace.current;
    if (!initialized || !sync) return;
    let current = true;
    setStatus("pending");
    const timer = setTimeout(async () => {
      setStatus("saving");
      try {
        await sync(flattenFileTreeToSchedulingFiles(tree));
        if (current) {
          setStatus("saved");
          setError("");
        }
      } catch (reason) {
        if (current) {
          setStatus("error");
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível sincronizar. Os arquivos continuam salvos neste navegador.",
          );
        }
      }
    }, 750);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [assignmentId, userId, tree, initialized, retryCount, draft]);
  return { status, error, retry };
}
