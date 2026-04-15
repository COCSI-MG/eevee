"use client";

import { getFileTree } from "@/app/integration/filestash";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { useWorkspaceContext } from "@/app/assignment/[id]/workspace/_providers/workspace-provider";
import {
  buildSchedulingPayloadFromFileTree,
  createWorkspaceStorageKey,
  getPreviewRunError,
  isActivePreviewRunStatus,
  mapPreviewRunToResponse,
} from "@/app/assignment/[id]/workspace/_utils/workspace-scheduling.utils";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";

interface UseWorkspacePreviewParams {
  assignmentId?: number;
  userId?: number;
}

export function useWorkspacePreview({
  assignmentId,
  userId,
}: UseWorkspacePreviewParams) {
  const { selectedItem } = useWorkspaceContext();
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewRunId, setPreviewRunId] = React.useState<number | null>(null);

  const previewStorageKey = React.useMemo(() => {
    if (!assignmentId || !userId) {
      return null;
    }

    return createWorkspaceStorageKey("preview-run", userId, assignmentId);
  }, [assignmentId, userId]);

  React.useEffect(() => {
    if (!previewStorageKey || typeof window === "undefined") {
      return;
    }

    const storedPreviewRunId = window.localStorage.getItem(previewStorageKey);
    if (!storedPreviewRunId) {
      return;
    }

    setPreviewRunId(Number(storedPreviewRunId));
    setPreviewOpen(true);
  }, [previewStorageKey]);

  const {
    data: previewRun,
    isError: isPreviewRunError,
    isFetching: isPreviewFetching,
  } = useQuery({
    queryKey: ["preview-run", previewRunId],
    queryFn: () => SchedulingService.getPreviewRun(previewRunId!),
    enabled: previewRunId !== null,
    refetchInterval: (query) =>
      query.state.data && isActivePreviewRunStatus(query.state.data.status)
        ? 2000
        : false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  React.useEffect(() => {
    if (!previewStorageKey || typeof window === "undefined" || !previewRun) {
      return;
    }

    if (isActivePreviewRunStatus(previewRun.status)) {
      window.localStorage.setItem(previewStorageKey, String(previewRun.id));
      setPreviewOpen(true);
      return;
    }

    window.localStorage.removeItem(previewStorageKey);

    if (previewRun.status === "cancelled") {
      setPreviewRunId(null);
      setPreviewOpen(false);
    }
  }, [previewRun, previewStorageKey]);

  React.useEffect(() => {
    if (!previewRunId || !isPreviewRunError) {
      return;
    }

    if (previewStorageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(previewStorageKey);
    }

    setPreviewRunId(null);
    setPreviewOpen(false);
  }, [isPreviewRunError, previewRunId, previewStorageKey]);

  const { mutate: runPreview, isPending: isStartingPreviewRun } = useMutation({
    mutationKey: ["run-assignment-preview"],
    mutationFn: async () => {
      if (!assignmentId || !userId || !selectedItem.path) {
        throw new Error("Missing required data");
      }

      const fileTree = await getFileTree(assignmentId, userId);
      if (!fileTree) {
        throw new Error("File tree not found");
      }

      const payload = buildSchedulingPayloadFromFileTree(assignmentId, fileTree);
      return SchedulingService.createPreviewRun(payload);
    },
    onMutate: () => {
      setPreviewOpen(true);
    },
    onError: (error) => {
      console.error("Error starting preview run", error);
      toast({
        title: "Ocorreu um erro ao iniciar o run",
        variant: "destructive",
      });
    },
    onSuccess: async (data) => {
      setPreviewRunId(data.id);

      if (previewStorageKey && typeof window !== "undefined") {
        window.localStorage.setItem(previewStorageKey, String(data.id));
      }
    },
  });

  const { mutateAsync: cancelPreviewRun } = useMutation({
    mutationKey: ["cancel-preview-run"],
    mutationFn: async (runId: number) => SchedulingService.cancelPreviewRun(runId),
  });

  const previewResult = React.useMemo(
    () => mapPreviewRunToResponse(previewRun),
    [previewRun],
  );

  const previewError = React.useMemo(
    () => getPreviewRunError(previewRun),
    [previewRun],
  );

  const previewLoading =
    isStartingPreviewRun ||
    isPreviewFetching ||
    (previewRun ? isActivePreviewRunStatus(previewRun.status) : false);

  const closePreview = React.useCallback(async () => {
    if (
      previewRunId &&
      previewRun &&
      isActivePreviewRunStatus(previewRun.status)
    ) {
      await cancelPreviewRun(previewRunId);
    }

    if (previewStorageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(previewStorageKey);
    }

    setPreviewOpen(false);
    setPreviewRunId(null);
  }, [cancelPreviewRun, previewRun, previewRunId, previewStorageKey]);

  return {
    previewError,
    previewLoading,
    previewOpen,
    previewResult,
    closePreview,
    runPreview,
  };
}
