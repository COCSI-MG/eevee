"use client";

import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { Route } from "@/app/routes";
import {
  buildSchedulingPayloadFromFileTree,
  createWorkspaceStorageKey,
  getLatestAssignmentAttempt,
  isProcessingAttemptStatus,
} from "@/app/assignment/[id]/workspace/_utils/workspace-scheduling.utils";
import { runWorkspacePreflight } from "@/app/assignment/[id]/workspace/_utils/workspace-preflight.utils";
import { getFileTree } from "@/app/integration/filestash";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { AuthSession } from "@/app/interface/scheduler-api/auth";

interface UseWorkspaceCorrectionParams {
  assignment?: Assignment;
  user?: AuthSession;
}

export function useWorkspaceCorrection({
  assignment,
  user,
}: UseWorkspaceCorrectionParams) {
  const router = useRouter();
  const [
    hasPersistedCorrectionInProgress,
    setHasPersistedCorrectionInProgress,
  ] = React.useState(false);

  const correctionStorageKey = React.useMemo(() => {
    if (!assignment?.id || !user?.userId) {
      return null;
    }

    return createWorkspaceStorageKey(
      "correction-running",
      user.userId,
      assignment.id,
    );
  }, [assignment?.id, user?.userId]);

  const hasCorrectionInProgressFromBackend = React.useMemo(() => {
    const latestAttempt = getLatestAssignmentAttempt(
      assignment?.assignmentAttempts,
    );

    return latestAttempt
      ? isProcessingAttemptStatus(latestAttempt.status)
      : false;
  }, [assignment?.assignmentAttempts]);

  React.useEffect(() => {
    if (!correctionStorageKey || typeof window === "undefined") {
      return;
    }

    setHasPersistedCorrectionInProgress(
      window.localStorage.getItem(correctionStorageKey) === "1",
    );
  }, [correctionStorageKey]);

  React.useEffect(() => {
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

  const { mutate: submitAssignment, isPending: isSubmittingCorrection } =
    useMutation({
      mutationKey: ["submit-assignment"],
      mutationFn: async () => {
        if (!assignment?.id || !user?.userId) {
          throw new Error("Missing required data");
        }

        const fileTree = await getFileTree(assignment.id, user.userId);
        if (!fileTree) {
          throw new Error("File tree not found");
        }

        const payload = buildSchedulingPayloadFromFileTree(
          assignment.id,
          fileTree,
        );

        const preflightResult = await runWorkspacePreflight({
          workerType: assignment.workerType,
          files: payload.files,
        });

        if (!preflightResult.ok) {
          throw new Error(
            [preflightResult.message, ...(preflightResult.details ?? [])]
              .filter(Boolean)
              .join("\n"),
          );
        }

        return SchedulingService.createSchedulingInBackground(payload);
      },
      onError: (error) => {
        console.error("Error submiting assignment", error);
        toast({
          title: "Falha na validação antes do envio",
          description:
            error instanceof Error
              ? error.message
              : "Ocorreu um erro ao submeter sua tarefa",
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
          title:
            "Seu trabalho foi recebido com sucesso e está sendo processado",
          variant: "default",
          duration: 5000,
        });

        if (user?.isAdmin) {
          const params = new URLSearchParams({
            assignmentId: String(assignment?.id ?? ""),
            userSearch: user.email,
            openLatest: "1",
          });

          router.push(`${Route.AdminAttempts}?${params.toString()}`);
        } else {
          router.back();
        }
      },
    });

  const isCorrectionInProgress =
    isSubmittingCorrection ||
    hasCorrectionInProgressFromBackend ||
    hasPersistedCorrectionInProgress;

  return {
    isCorrectionInProgress,
    submitAssignment,
  };
}
