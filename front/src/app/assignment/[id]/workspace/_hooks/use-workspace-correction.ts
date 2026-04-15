"use client";

import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { User } from "@/app/interface/scheduler-api/user";
import { Route } from "@/app/routes";
import { useWorkspaceContext } from "@/app/assignment/[id]/workspace/_providers/workspace-provider";
import {
  buildSchedulingPayloadFromFileTree,
  createWorkspaceStorageKey,
  getLatestAssignmentAttempt,
  isProcessingAttemptStatus,
} from "@/app/assignment/[id]/workspace/_utils/workspace-scheduling.utils";
import { getFileTree } from "@/app/integration/filestash";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";

interface UseWorkspaceCorrectionParams {
  assignment?: Assignment;
  user?: Pick<User, "id" | "email" | "isAdmin">;
}

export function useWorkspaceCorrection({
  assignment,
  user,
}: UseWorkspaceCorrectionParams) {
  const router = useRouter();
  const { selectedItem } = useWorkspaceContext();
  const [
    hasPersistedCorrectionInProgress,
    setHasPersistedCorrectionInProgress,
  ] = React.useState(false);

  const correctionStorageKey = React.useMemo(() => {
    if (!assignment?.id || !user?.id) {
      return null;
    }

    return createWorkspaceStorageKey(
      "correction-running",
      user.id,
      assignment.id,
    );
  }, [assignment?.id, user?.id]);

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
        if (!assignment?.id || !user?.id || !selectedItem.path) {
          throw new Error("Missing required data");
        }

        const fileTree = await getFileTree(assignment.id, user.id);
        if (!fileTree) {
          throw new Error("File tree not found");
        }

        const payload = buildSchedulingPayloadFromFileTree(
          assignment.id,
          fileTree,
        );
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
