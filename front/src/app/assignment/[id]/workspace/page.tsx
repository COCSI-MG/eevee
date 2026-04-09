"use client";

import { getFileTree } from "@/app/integration/filestash";
import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Route } from "@/app/routes";
import WorkspaceHeader from "@/components/workspace/header";
import Workspace from "@/components/workspace/workspace";
import WorkspaceAgreement from "@/components/workspace/workspace-agreement";
import { WorkspaceLoading } from "@/components/workspace/workspace-loading";
import { WorkspaceRunPreviewDialog } from "@/components/workspace/workspace-run-preview-dialog";
import { useWorkspaceContext } from "@/components/workspace/workspace-provider";
import { WorkspaceSuspension } from "@/components/workspace/workspace-suspension";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFetchFileContent } from "@/hooks/use-filestash";
import { toast } from "@/hooks/use-toast";
import { FileNode } from "@/types/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  SchedulingPreviewRun,
  SchedulingResponse,
} from "@/app/interface/scheduler-api/scheduling";

const PROCESSING_ATTEMPT_STATUSES = new Set(["pending", "enqueded", "running"]);
const ACTIVE_PREVIEW_STATUSES = new Set(["pending", "running"]);

export default function Page() {
  const { id } = useParams();
  const { back, push } = useRouter();
  const { user } = useAuthContext();
  const { selectedItem } = useWorkspaceContext();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const { data: assignmentData, isLoading: isLoadingAssignment } =
    useFetchAssignment(Number(id));

  // Estado para controlar se o usuário aceitou o acordo
  const [hasAcceptedAgreement, setHasAcceptedAgreement] =
    useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRunId, setPreviewRunId] = useState<number | null>(null);
  const [hasPersistedCorrectionInProgress, setHasPersistedCorrectionInProgress] =
    useState(false);

  const correctionStorageKey = useMemo(() => {
    if (!user?.id || !assignmentData?.id) {
      return null;
    }

    return `workspace-correction-running:${user.id}:${assignmentData.id}`;
  }, [assignmentData?.id, user?.id]);

  const previewStorageKey = useMemo(() => {
    if (!user?.id || !assignmentData?.id) {
      return null;
    }

    return `workspace-preview-run:${user.id}:${assignmentData.id}`;
  }, [assignmentData?.id, user?.id]);

  const hasCorrectionInProgressFromBackend = useMemo(() => {
    const latestAttempt = [...(assignmentData?.assignmentAttempts ?? [])].sort(
      (a, b) => b.attempt - a.attempt,
    )[0];

    return latestAttempt
      ? PROCESSING_ATTEMPT_STATUSES.has(latestAttempt.status)
      : false;
  }, [assignmentData?.assignmentAttempts]);

  useEffect(() => {
    if (!correctionStorageKey || typeof window === "undefined") {
      return;
    }

    setHasPersistedCorrectionInProgress(
      window.localStorage.getItem(correctionStorageKey) === "1",
    );
  }, [correctionStorageKey]);

  useEffect(() => {
    if (!correctionStorageKey || typeof window === "undefined") {
      return;
    }

    if (hasCorrectionInProgressFromBackend) {
      window.localStorage.setItem(correctionStorageKey, "1");
      setHasPersistedCorrectionInProgress(true);
      return;
    }

    window.localStorage.removeItem(correctionStorageKey);
    setHasPersistedCorrectionInProgress(false);
  }, [correctionStorageKey, hasCorrectionInProgressFromBackend]);

  useEffect(() => {
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

  const buildSchedulingPayload = async () => {
    if (!assignmentData?.id || !user?.id || !selectedItem.path) {
      return Promise.reject("Missing required data");
    }

    const flattenFileTreeToSchedulingFiles = (
      node: FileNode,
      acc: Record<string, string> = {},
    ): Record<string, string> => {
      if (node.isFile) {
        acc[node.path] = node.content ?? "";
        return acc;
      }

      if (node.children?.length) {
        node.children.forEach((child) => {
          flattenFileTreeToSchedulingFiles(child, acc);
        });
      }

      return acc;
    };

    const fileTree = await getFileTree(assignmentData.id, user.id);
    if (!fileTree) {
      return Promise.reject("File tree not found");
    }

    const schedulingFiles = flattenFileTreeToSchedulingFiles(fileTree);

    return {
      assignmentId: assignmentData.id,
      applicationFileContent: undefined,
      files: schedulingFiles,
    };
  };

  const {
    data: previewRun,
    isError: isPreviewRunError,
    isFetching: isPreviewFetching,
  } = useQuery<SchedulingPreviewRun>({
    queryKey: ["preview-run", previewRunId],
    queryFn: () => SchedulingService.getPreviewRun(previewRunId!),
    enabled: previewRunId !== null,
    refetchInterval: (query) =>
      query.state.data &&
      ACTIVE_PREVIEW_STATUSES.has(query.state.data.status)
        ? 2000
        : false,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (!previewStorageKey || typeof window === "undefined" || !previewRun) {
      return;
    }

    if (ACTIVE_PREVIEW_STATUSES.has(previewRun.status)) {
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

  const { mutate: runAssignment, isPending: isStartingPreviewRun } = useMutation(
    {
      mutationKey: ["run-assignment-preview"],
      mutationFn: async () => {
        const payload = await buildSchedulingPayload();
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
    }
  );

  const { mutateAsync: cancelPreviewRun } = useMutation({
    mutationKey: ["cancel-preview-run"],
    mutationFn: async (runId: number) => SchedulingService.cancelPreviewRun(runId),
  });

  const { mutate: submitAssignment, isPending: isSubmittingCorrection } =
    useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: async () => {
      const payload = await buildSchedulingPayload();
      return SchedulingService.createSchedulingInBackground(payload);
    },
    onError: (error) => {
      console.error("Error submiting assignment", error);
      toast({
        title: "Ocorreu um erro ao submeter sua tarefa",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      console.log(data);

      if (correctionStorageKey && typeof window !== "undefined") {
        window.localStorage.setItem(correctionStorageKey, "1");
        setHasPersistedCorrectionInProgress(true);
      }

      toast({
        title: "Seu trabalho foi recebido com sucesso e está sendo processado",
        variant: "default",
        duration: 5000,
      });

      if (user?.isAdmin) {
        const params = new URLSearchParams({
          assignmentId: String(assignmentData?.id ?? ""),
          userSearch: user.email,
          openLatest: "1",
        });

        push(`${Route.AdminAttempts}?${params.toString()}`);
      } else {
        back();
      }
    },
  });

  const isCorrectionInProgress =
    isSubmittingCorrection ||
    hasCorrectionInProgressFromBackend ||
    hasPersistedCorrectionInProgress;

  const previewResult: SchedulingResponse | null =
    previewRun?.status === "completed"
      ? {
          assignmentId: previewRun.assignmentId,
          isAcceptable: Boolean(previewRun.isAcceptable),
          score: Number(previewRun.score ?? 0),
          passes: Number(previewRun.passes ?? 0),
          fails: Number(previewRun.fails ?? 0),
          report: previewRun.report ?? "",
        }
      : null;

  const previewError =
    previewRun?.status === "failed" ? previewRun.errorMessage ?? "Preview failed" : null;

  const previewLoading =
    isStartingPreviewRun ||
    isPreviewFetching ||
    (previewRun ? ACTIVE_PREVIEW_STATUSES.has(previewRun.status) : false);

  useEffect(() => {
    if (!previewRunId || !isPreviewRunError) {
      return;
    }

    if (previewStorageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(previewStorageKey);
    }

    setPreviewRunId(null);
    setPreviewOpen(false);
  }, [isPreviewRunError, previewRunId, previewStorageKey]);

  const { mutate: saveFileInServer, isPending: isSaving } = useMutation({
    mutationKey: ["save-file-in-saver"],
    mutationFn: async () => {
      if (!assignmentData?.id || !user?.id || !selectedItem.path) {
        return Promise.reject("Missing required data");
      }

      const fileContent = await fetchFileContent({
        assignmentId: assignmentData.id,
        userId: user.id,
        filePath: selectedItem.path,
      });

      if (fileContent == null) {
        return Promise.reject("File content is empty");
      }

      const file = new File([fileContent], selectedItem.id, {
        type: "text/plain",
      });
      return FileSaverService.uploadFileToServer(file, Number(id));
    },
  });

  const isUserSuspended = (assignmentData: Assignment) => {
    return assignmentData?.suspensions?.some(
      (suspension) => suspension.userId === user?.id,
    );
  };

  const handleAcceptAgreement = () => {
    setHasAcceptedAgreement(true);
  };

  // Loading state
  if (isLoadingAssignment && !assignmentData) {
    return <WorkspaceLoading />;
  }

  // Suspension check
  if (assignmentData && isUserSuspended(assignmentData)) {
    return <WorkspaceSuspension />;
  }

  // Agreement check - APENAS para não-admins que ainda não aceitaram
  if (user && !user.isAdmin && assignmentData && !hasAcceptedAgreement) {
    return (
      <WorkspaceAgreement
        title={assignmentData.title}
        onAccept={handleAcceptAgreement}
        assignmentId={assignmentData.id}
      />
    );
  }

  // Workspace principal (após aceitar ou se for admin)
  return (
    <>
      <WorkspaceHeader
        assignment={{
          title: assignmentData ? assignmentData.title : "",
          description: assignmentData ? assignmentData.description : "",
        }}
        onRunClick={() => runAssignment()}
        onSubmitClick={() => submitAssignment()}
        onSaveClick={() => saveFileInServer()}
        isRunningSync={previewLoading}
        isSubmittingCorrection={isCorrectionInProgress}
        isSaving={isSaving}
      />

      <WorkspaceRunPreviewDialog
        open={previewOpen}
        loading={previewLoading}
        result={previewResult}
        error={previewError}
        onClose={async () => {
          if (
            previewRunId &&
            previewRun &&
            ACTIVE_PREVIEW_STATUSES.has(previewRun.status)
          ) {
            await cancelPreviewRun(previewRunId);
          }

          if (previewStorageKey && typeof window !== "undefined") {
            window.localStorage.removeItem(previewStorageKey);
          }

          setPreviewOpen(false);
          setPreviewRunId(null);
        }}
      />

      {assignmentData && user && (
        <Workspace assignment={assignmentData} user={user} />
      )}
    </>
  );
}
