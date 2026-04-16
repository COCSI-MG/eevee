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
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const userId = user?.userId;
  // Estado para controlar se o usuário aceitou o acordo
  const [hasAcceptedAgreement, setHasAcceptedAgreement] =
    useState<boolean>(false);

  const { data: assignmentData, isLoading: isLoadingAssignment } =
    useFetchAssignment(Number(id));

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
    <div className="h-screen text-foreground flex flex-col">
      <WorkspaceHeader
        assignment={{
          title: assignmentData ? assignmentData.title : "",
          description: assignmentData ? assignmentData.description : "",
        }}
        onRunClick={() => runPreview()}
        onSubmitClick={() => submitAssignment()}
        onSaveClick={() => saveFileInServer()}
        isRunningSync={previewLoading}
        isSubmittingCorrection={isCorrectionInProgress}
        isSaving={isSaving}
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
        <Workspace assignment={assignmentData} user={user} />
      )}
    </div>
  );
}
