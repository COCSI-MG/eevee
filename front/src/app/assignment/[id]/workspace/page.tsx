"use client";

import { getFileTree } from "@/app/integration/filestash";
import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import WorkspaceHeader from "@/components/workspace/header";
import Workspace from "@/components/workspace/workspace";
import WorkspaceAgreement from "@/components/workspace/workspace-agreement";
import { WorkspaceLoading } from "@/components/workspace/workspace-loading";
import { useWorkspaceContext } from "@/components/workspace/workspace-provider";
import { WorkspaceSuspension } from "@/components/workspace/workspace-suspension";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFetchFileContent } from "@/hooks/use-filestash";
import { toast } from "@/hooks/use-toast";
import { FileNode } from "@/types/shared";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const { id } = useParams();
  const { back } = useRouter();
  const { user } = useAuthContext();
  const { selectedItem } = useWorkspaceContext();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const { data: assignmentData, isLoading: isLoadingAssignment } =
    useFetchAssignment(Number(id));

  // Estado para controlar se o usuário aceitou o acordo
  const [hasAcceptedAgreement, setHasAcceptedAgreement] =
    useState<boolean>(false);

  const { mutate: submitAssignment, isPending: isSubmitting } = useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: async () => {
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

      return SchedulingService.createSchedulingInBackground({
        assignmentId: assignmentData.id,
        applicationFileContent: undefined, // Você pode ajustar isso conforme necessário
        files: schedulingFiles,
      });
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

      toast({
        title: "Seu trabalho foi recebido com sucesso e está sendo processado",
        variant: "default",
      });

      back();
    },
  });

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
        onRunClick={() => submitAssignment()}
        onSaveClick={() => saveFileInServer()}
        isRunning={isSubmitting}
        isSaving={isSaving}
      />

      {assignmentData && user && (
        <Workspace assignment={assignmentData} user={user} />
      )}
    </>
  );
}
