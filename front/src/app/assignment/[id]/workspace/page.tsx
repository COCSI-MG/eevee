"use client";

import WorkspaceHeader from "@/app/assignment/[id]/workspace/_components/workspace-header";
import Workspace from "@/app/assignment/[id]/workspace/_components/workspace";
import WorkspaceAgreement from "@/app/assignment/[id]/workspace/_components/workspace-agreement";
import { WorkspaceLoading } from "@/app/assignment/[id]/workspace/_components/workspace-loading";
import { WorkspaceRunPreviewDialog } from "@/app/assignment/[id]/workspace/_components/workspace-run-preview-dialog";
import { WorkspaceSuspension } from "@/app/assignment/[id]/workspace/_components/workspace-suspension";
import { useWorkspaceCorrection } from "@/app/assignment/[id]/workspace/_hooks/use-workspace-correction";
import { useWorkspacePreview } from "@/app/assignment/[id]/workspace/_hooks/use-workspace-preview";
import { useWorkspaceSaveFile } from "@/app/assignment/[id]/workspace/_hooks/use-workspace-save-file";
import { Route } from "@/app/routes";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { toast } from "@/hooks/use-toast";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import QueryErrorState from "@/components/shared/query-error-state";
import { isAxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { earliestDate, isDeadlinePassed } from "@/utils/date";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = user?.userId;
  const assignmentId = Number(id);
  const isInvalidAssignmentId =
    !Number.isInteger(assignmentId) || assignmentId <= 0;
  const handledUnavailableAssignmentRef = useRef<string | null>(null);
  // Estado para controlar se o usuário aceitou o acordo
  const [hasAcceptedAgreement, setHasAcceptedAgreement] =
    useState<boolean>(false);
  const [resetWorkspaceAction, setResetWorkspaceAction] = useState<
    ((assignment?: Assignment) => Promise<void>) | null
  >(null);
  const [isResettingWorkspace, setIsResettingWorkspace] =
    useState<boolean>(false);
  const [isRefreshingAssignmentForClear, setIsRefreshingAssignmentForClear] =
    useState<boolean>(false);

  const handleResetWorkspaceReady = (
    resetAction: ((assignment?: Assignment) => Promise<void>) | null,
  ) => {
    setResetWorkspaceAction(() => resetAction);
  };

  const {
    data: assignmentData,
    isLoading: isLoadingAssignment,
    isFetching: isFetchingAssignment,
    isError: isAssignmentError,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useFetchAssignment(assignmentId);

  const isAssignmentNotFound = isAssignmentError && isAxiosError(assignmentError) && (assignmentError.response?.status ?? assignmentError.status) === 404;

  const isAssignmentUnavailable = isInvalidAssignmentId || isAssignmentNotFound;

  useEffect(() => {
    if (
      !userId ||
      !isAssignmentUnavailable ||
      handledUnavailableAssignmentRef.current === id
    ) {
      return;
    }

    handledUnavailableAssignmentRef.current = id;

    toast({
      title: "Atividade indisponível",
      description:
        "A atividade não existe ou não está disponível para o seu usuário.",
      variant: "destructive",
    });


    setTimeout(() => {
      if (window.history.length > 1) {
        router.back();
        return;
      }

      router.replace(user?.isAdmin ? Route.AdminAssignments : `/${Route.Classes}`);
    }, 2000)
  }, [id, isAssignmentUnavailable, router, user?.isAdmin, userId]);

  const handleClearWorkspace = async () => {
    if (!resetWorkspaceAction || !assignmentData) {
      return;
    }

    setIsRefreshingAssignmentForClear(true);
    try {
      const { data: freshAssignment } = await refetchAssignment({
        throwOnError: true,
      });

      if (!freshAssignment) {
        throw new Error("Dados da atividade estão vazios após recarregamento");
      }

      await resetWorkspaceAction(freshAssignment);
    } catch (error) {
      console.error(
        "Error refetching assignment before workspace reset:",
        error,
      );
      toast({
        title: "Falha ao limpar workspace",
        description:
          "Não foi possível buscar a versão mais recente da atividade.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingAssignmentForClear(false);
    }
  };

  // Correção
  const { isCorrectionInProgress, submitAssignment } = useWorkspaceCorrection({
    assignment: assignmentData,
    user: user ?? undefined,
  });

  // Preview
  const {
    closePreview,
    previewError,
    previewLoading,
    previewOpen,
    previewResult,
    isCancellingPreviewRun,
    showCancelledFeedback,
    runPreview,
  } = useWorkspacePreview({
    assignmentId: assignmentData?.id,
    userId,
    workerType: assignmentData?.workerType,
  });

  const { isSaving, saveFileInServer } = useWorkspaceSaveFile({
    assignmentId: assignmentData?.id,
    userId,
  });

  const isUserSuspended = (assignmentData: {
    suspensions?: { userId: number }[];
  }) => {
    if (!userId) {
      return false;
    }

    return Boolean(
      assignmentData?.suspensions?.some(
        (suspension) => suspension.userId === userId,
      ),
    );
  };

  const handleAcceptAgreement = () => {
    setHasAcceptedAgreement(true);
  };

  // Loading state
  if (isLoadingAssignment && !assignmentData) {
    return <WorkspaceLoading />;
  }

  if (!userId) {
    return <WorkspaceLoading />;
  }

  if (isAssignmentUnavailable) {
    return <WorkspaceLoading />;
  }

  if (isAssignmentError && !assignmentData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
        <QueryErrorState
          title="Não foi possível carregar a atividade"
          description="Ocorreu um erro ao buscar os dados da atividade. Tente novamente."
          onRetry={() => void refetchAssignment()}
          isRetrying={isFetchingAssignment}
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  // Suspension check
  if (assignmentData && isUserSuspended(assignmentData)) {
    return <WorkspaceSuspension />;
  }

  const effectiveDueDate = earliestDate(assignmentData?.dueDate, assignmentData?.examAssignment?.exam?.dueDate);

  const isSubmissionClosed = Boolean(
    assignmentData &&
    !user?.isAdmin &&
    isDeadlinePassed(effectiveDueDate),
  );

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
    <div className="h-screen text-foreground flex flex-col">
      <WorkspaceHeader
        assignment={{
          title: assignmentData ? assignmentData.title : "",
          description: assignmentData ? assignmentData.description : "",
          startDate: assignmentData?.startDate,
          dueDate: effectiveDueDate,
        }}
        onRunClick={() => runPreview()}
        onSubmitClick={() => submitAssignment()}
        onSaveClick={() => saveFileInServer()}
        onClearClick={handleClearWorkspace}
        isRunningSync={previewLoading}
        isSubmittingCorrection={isCorrectionInProgress}
        isSaving={isSaving}
        isClearing={isResettingWorkspace || isRefreshingAssignmentForClear}
        canClear={Boolean(resetWorkspaceAction)}
        isSubmissionClosed={isSubmissionClosed}
      />

      <WorkspaceRunPreviewDialog
        open={previewOpen}
        loading={previewLoading}
        cancelling={isCancellingPreviewRun}
        cancelled={showCancelledFeedback}
        result={previewResult}
        error={previewError}
        onClose={async () => {
          await closePreview();
        }}
      />

      {assignmentData && user && (
        <Workspace
          assignment={assignmentData}
          user={user}
          onResetWorkspaceReady={handleResetWorkspaceReady}
          onResettingChange={setIsResettingWorkspace}
        />
      )}
    </div>
  );
}
