"use client";

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
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
  const { id } = useParams();

  const { back } = useRouter();

  const { user } = useAuthContext();

  const { data: assignmentData, isFetching: isFetchingAssignment } =
    useFetchAssignment(Number(id));

  const { selectedItem, currentStep, setCurrentStep } = useWorkspaceContext();

  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const { mutate: submitAssignment, isPending: isSubmitting } = useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: async () => {
      if (!assignmentData?.id || !user?.id || !selectedItem.path) {
        return Promise.reject("Missing required data");
      }

      const fileContent = await fetchFileContent({
        assignmentId: assignmentData.id,
        userId: user.id,
        filePath: selectedItem.path,
      });

      if (!fileContent) {
        return Promise.reject("File content is empty");
      }

      if (user?.isAdmin) {
        return SchedulingService.createScheduling({
          assignmentId: assignmentData.id,
          applicationFileContent: fileContent,
        });
      }

      return SchedulingService.createSchedulingInBackground({
        assignmentId: assignmentData.id,
        applicationFileContent: fileContent,
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

      if (user?.isAdmin) {
        alert("Resultado da tarefa :\n" + JSON.stringify(data));
        return;
      }

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

      if (!fileContent) {
        return Promise.reject("File content is empty");
      }

      const file = new File([fileContent], selectedItem.name, {
        type: "text/plain",
      });
      return FileSaverService.uploadFileToServer(file, Number(id));
    },
  });

  const isUserSuspended = (assignmentData: Assignment) => {
    return assignmentData?.suspensions?.some(
      (suspension) => suspension.userId === user?.id
    );
  };

  if (isFetchingAssignment) {
    return <WorkspaceLoading />;
  }

  if (assignmentData && isUserSuspended(assignmentData)) {
    return <WorkspaceSuspension />;
  }

  if (user && !user.isAdmin && assignmentData && currentStep === 1) {
    return (
      <WorkspaceAgreement
        title={assignmentData.title}
        onAccept={() => setCurrentStep(2)}
        assignmentId={assignmentData.id}
      />
    );
  }

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
