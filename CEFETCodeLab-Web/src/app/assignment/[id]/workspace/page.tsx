"use client";

import { DEFAULT_ASSIGNMENT_TEMPLATE } from "@/app/admin/assignments/constants";
import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import WorkspaceHeader from "@/components/workspace/header";
import WorkspaceCodeEditor from "@/components/workspace/workspace-code-editor";
import WorkspaceExplorer from "@/components/workspace/workspace-explorer";
import { useFetchAssignment } from "@/hooks/use-assignments";
import {
  useFetchFromStash,
  useFileStash,
  useSaveInFileStash,
} from "@/hooks/use-filestash";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { toast } from "@/hooks/use-toast";
import { FileTreeData } from "@/types/shared";
import { useMutation } from "@tanstack/react-query";
import { FileStrucutre } from "filestash";
import { useParams } from "next/navigation";
import React from "react";

const defaultTreeData: FileTreeData[] = [
  {
    id: "1",
    label: "src",
    isSelectable: false,
    isFile: false,
    children: [
      {
        id: "2",
        label: "index.js",
        isSelectable: true,
        isFile: true,
      },
    ],
  },
];

export default function Page() {
  const { id } = useParams();
  const [activeFile, setActiveFile] = React.useState<{
    id: string;
    name: string;
  }>({
    id: "2",
    name: "index.js",
  });
  const [treeData, setTreeData] = React.useState<FileTreeData[]>([]);
  const [defaultEditorValue, setDefaultEditorValue] = React.useState<string>(
    DEFAULT_ASSIGNMENT_TEMPLATE
  );

  useFileStash();
  usePreventUserActions();

  const { mutate: saveFileInStash } = useSaveInFileStash();

  const {
    mutate: fetchFileContentFromStash,
    mutateAsync: fetchFileContentFromStashAsync,
    data: fileContent,
  } = useFetchFromStash();

  const { data: assignmentData, isLoading: isAssignmentLoading } =
    useFetchAssignment(Number(id));

  const { mutate: submitAssignment } = useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: async () => {
      const fileKey = `assignment-${assignmentData?.id}-file-${activeFile.id}`;
      const fileContent = await fetchFileContentFromStashAsync(fileKey);

      return SchedulingService.createScheduling({
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
      //TODO: handle some animations here
      toast({
        title: "Seu trabalho foi enviado com sucesso",
        variant: "default",
      });
    },
  });

  React.useEffect(() => {
    if (activeFile.id && assignmentData?.id) {
      const fileKey = `assignment-${assignmentData.id}-file-${activeFile.id}`
      fetchFileContentFromStashAsync(fileKey)
        .then((data) => {
          if (data) {
            setDefaultEditorValue(data.toString());
          }
        })
    }
  }, [activeFile.id, assignmentData?.id, fetchFileContentFromStashAsync]);

  const { mutate: saveFileInServer } = useMutation({
    mutationKey: ["save-file-in-saver"],
    mutationFn: async () => {
      const fileKey = `assignment-${assignmentData?.id}-file-${activeFile.id}`;
      const fileContent = await fetchFileContentFromStashAsync(fileKey);

      const file = new File([fileContent], activeFile.name, {
        type: "text/plain",
      });
      return FileSaverService.uploadFileToServer(file, Number(id));
    },
  });

  React.useEffect(() => {
    if (id) {
      setTreeData(defaultTreeData);
    }
  }, [id]);

  const handleFileSelect = (fileId: string) => {
    const selectedFile = treeData
      .flatMap((item) => item.children || [])
      .find((file) => file.id === fileId);
    if (selectedFile) {
      setActiveFile({
        id: selectedFile.id,
        name: selectedFile.label,
      });
      const fileKey = `assignment-${assignmentData?.id}-file-${fileId}`;
      fetchFileContentFromStash(fileKey);
    }
  };

  const handleRun = () => {
    submitAssignment();
  };

  const handleServerSave = () => {
    saveFileInServer();
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const fileKey = `assignment-${assignmentData?.id}-file-${activeFile.id}`;
      const fileData: FileStrucutre = {
        name: activeFile.name,
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

  if (isAssignmentLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Carregando atividade...</p>
      </div>
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
      />

      <div className="flex flex-1 min-h-0">
        <WorkspaceExplorer
          treeData={treeData}
          onFileSelect={handleFileSelect}
        />

        <div className="flex-1 flex flex-col">
          <WorkspaceCodeEditor
            activeFile={activeFile.name}
            editorValue={fileContent?.toString()}
            editorDefaultValue={defaultEditorValue}
            onEditorChange={handleEditorChange}
          />
        </div>
      </div>
    </div>
  );
}
