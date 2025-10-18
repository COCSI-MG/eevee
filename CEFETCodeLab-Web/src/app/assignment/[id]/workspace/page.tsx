"use client";

import { DEFAULT_ASSIGNMENT_TEMPLATE } from "@/app/admin/assignments/constants";
import { AssignmentUserSuspensionService } from "@/app/integration/scheduler-api/assignment-user-suspension";
import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { Button } from "@/components/ui/button";
import WindowFocusDialog from "@/components/window-focus-dialog";
import WorkspaceHeader from "@/components/workspace/header";
import WorkspaceAgreement from "@/components/workspace/workspace-agreement";
import WorkspaceCodeEditor from "@/components/workspace/workspace-code-editor";
import WorkspaceExplorer from "@/components/workspace/workspace-explorer";
import {
  useWorkspaceContext,
  WorkspaceProvider,
} from "@/components/workspace/worskpace-provider";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useFetchFromStash, useSaveInFileStash } from "@/hooks/use-filestash";
import { toast } from "@/hooks/use-toast";
import { getFileStashKey } from "@/lib/utils";
import { FileNode, SelectedItem } from "@/types/shared";
import { useMutation } from "@tanstack/react-query";
import { FileStrucutre } from "filestash";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback } from "react";

const defaultTreeData: FileNode[] = [
  {
    id: "1",
    label: "src",
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: "2",
        label: "index.js",
        isSelectable: true,
        isFile: true,
        path: "src/index.js",
      },
    ],
    path: "src",
  },
];

const WorskpacePageContent: React.FC = () => {
  const { id } = useParams();
  const { back } = useRouter();

  const { user } = useAuthContext();

  const [defaultEditorValue, setDefaultEditorValue] = React.useState<string>(
    DEFAULT_ASSIGNMENT_TEMPLATE
  );

  const {
    selectedItem,
    setSelectedItem,
    currentStep,
    setCurrentStep,
    setFileTreeData,
  } = useWorkspaceContext();

  const { mutate: saveFileInStash } = useSaveInFileStash();

  const {
    mutate: fetchFileContentFromStash,
    mutateAsync: fetchFileContentFromStashAsync,
    data: fileContent,
  } = useFetchFromStash();

  const { data: assignmentData, isFetching: isFetchingAssignment } =
    useFetchAssignment(Number(id));

  const { mutate: submitAssignment, isPending: isSubmitting } = useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: async () => {
      const fileKey = getFileStashKey(
        assignmentData?.id ?? 0,
        selectedItem.id,
        user?.id
      );
      const fileContent = await fetchFileContentFromStashAsync(fileKey);
      if (fileContent === null) {
        return Promise.reject("File content is empty");
      }

      if (user?.isAdmin) {
        return SchedulingService.createScheduling({
          assignmentId: Number(id),
          applicationFileContent: fileContent.toString(),
        });
      }

      return SchedulingService.createSchedulingInBackground({
        assignmentId: Number(id),
        applicationFileContent: fileContent.toString(),
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

  const handleFetchFileContentFromStash = useCallback(
    async (
      selectedItemId: string,
      userId: number | undefined,
      assignmentId: number | undefined
    ) => {
      const fileKey = getFileStashKey(
        assignmentId ?? 0,
        selectedItemId,
        userId
      );

      const data = await fetchFileContentFromStashAsync(fileKey);
      if (data) {
        setDefaultEditorValue(data.toString());
      }
    },
    [fetchFileContentFromStashAsync]
  );

  React.useEffect(() => {
    if (selectedItem.id && assignmentData?.id) {
      handleFetchFileContentFromStash(
        selectedItem.id,
        user?.id,
        assignmentData?.id
      );
    }
  }, [
    selectedItem.id,
    assignmentData?.id,
    fetchFileContentFromStashAsync,
    user?.id,
    handleFetchFileContentFromStash,
  ]);

  const { mutate: saveFileInServer, isPending: isSaving } = useMutation({
    mutationKey: ["save-file-in-saver"],
    mutationFn: async () => {
      const fileKey = getFileStashKey(
        assignmentData?.id ?? 0,
        selectedItem.id,
        user?.id
      );
      const fileContent = await fetchFileContentFromStashAsync(fileKey);
      if (fileContent === null) {
        return Promise.reject("File content is empty");
      }
      const file = new File([fileContent], selectedItem.name, {
        type: "text/plain",
      });
      return FileSaverService.uploadFileToServer(file, Number(id));
    },
  });

  const { mutate: suspendUserFromAssignment } = useMutation({
    mutationFn: async () => {
      return AssignmentUserSuspensionService.suspendUserFromAssignment(
        Number(id),
        "window_focus"
      );
    },
  });

  React.useEffect(() => {
    if (id) {
      setFileTreeData(defaultTreeData);
    }
  }, [id, setFileTreeData]);

  const handleFileSelect = (node: FileNode) => {
    setSelectedItem({
      id: node.id,
      name: node.label,
      type: node.isFile ? "file" : "folder",
      path: node.path,
    });
    const fileKey = `assignment-${assignmentData?.id}-file-${node.id}`;
    fetchFileContentFromStash(fileKey);
  };

  const handleRun = () => {
    submitAssignment();
  };

  const handleServerSave = () => {
    saveFileInServer();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const fileKey = getFileStashKey(
        assignmentData?.id ?? 0,
        selectedItem.id,
        user?.id
      );

      const fileData: FileStrucutre = {
        name: selectedItem.name,
        data: value,
        size: value.length,
        createdAt: Date.now().toString(),
        updateAt: Date.now().toString(),
      };
      saveFileInStash({
        fileData,
        fileKey,
      });
    }
  };

  if (isFetchingAssignment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Carregando atividade...</p>
      </div>
    );
  }

  if (
    assignmentData &&
    assignmentData.suspensions?.some(
      (suspension) => suspension.userId === user?.id
    )
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-red-500">
            Você está suspenso desta atividade. Entre em contato com o professor
            para mais informações.
          </p>
        </div>

        <Button
          onClick={() => back()}
          className="mt-4 justify-center w-64"
          variant={"outline"}
        >
          Voltar
        </Button>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <WorkspaceAgreement
        title={assignmentData?.title ?? ""}
        onAccept={() => setCurrentStep(2)}
      />
    );
  }

  return (
    <div className="h-screen text-foreground flex flex-col">
      <WorkspaceHeader
        assignment={{
          title: assignmentData !== undefined ? assignmentData.title : "",
          description:
            assignmentData !== undefined ? assignmentData.description : "",
        }}
        onRunClick={handleRun}
        onSaveClick={handleServerSave}
        isRunning={isSubmitting}
        isSaving={isSaving}
      />

      {user?.isAdmin === false && (
        <WindowFocusDialog
          suspendUserFromAssignment={suspendUserFromAssignment}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <WorkspaceExplorer onFileSelect={handleFileSelect} />

        <div className="flex-1 flex flex-col">
          <WorkspaceCodeEditor
            activeFile={selectedItem.name}
            editorValue={fileContent?.toString()}
            editorDefaultValue={defaultEditorValue}
            onEditorChange={handleEditorChange}
          />
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  const initialSelectedItem: SelectedItem = {
    id: "2",
    name: "index.js",
    type: "file",
    path: "src/index.js",
  };

  return (
    <WorkspaceProvider initialSelectedItem={initialSelectedItem}>
      <WorskpacePageContent />
    </WorkspaceProvider>
  );
}
