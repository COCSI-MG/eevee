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
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  useFetchFromStash,
  useFileStash,
  useSaveInFileStash,
} from "@/hooks/use-filestash";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { toast } from "@/hooks/use-toast";
import { getFileStashKey } from "@/lib/utils";
import { FileNode, SelectedItem } from '@/types/shared';
import { useMutation } from '@tanstack/react-query';
import { FileStrucutre } from 'filestash';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';

const defaultTreeData: FileNode[] = [
  {
    id: '1',
    label: 'src',
    isSelectable: true,
    isFile: false,
    children: [
      {
        id: '2',
        label: 'index.js',
        isSelectable: true,
        isFile: true,
        path: 'src/index.js',
      },
    ],
    path: 'src',
  },
];

export default function Page() {
  const { id } = useParams();
  const [selectedItem, setSelectedItem] = React.useState<SelectedItem>({
    id: '2',
    name: 'index.js',
    type: 'file',
    path: 'src/index.js',
  });
  const [treeData, setTreeData] = React.useState<FileNode[]>([]);
  const [defaultEditorValue, setDefaultEditorValue] = React.useState<string>(
    DEFAULT_ASSIGNMENT_TEMPLATE
  );
  const { user } = useAuthUser();
  const { back } = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);

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

  const { mutate: submitAssignment, isPending: isSubmitting } = useMutation({
    mutationKey: ['submit-assignment'],
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
      return SchedulingService.createSchedulingInBackground({
        assignmentId: Number(id),
        applicationFileContent: fileContent.toString(),
      });
    },
    onError: (error) => {
      console.error('Error submiting assignment', error);
      toast({
        title: 'Ocorreu um erro ao submeter sua tarefa',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      console.log(data);

      toast({
        title: 'Seu trabalho foi recebido com sucesso e está sendo processado',
        variant: 'default',
      });

      back();
    },
  });

  React.useEffect(() => {
    if (selectedItem.id && assignmentData?.id) {
      const fileKey = getFileStashKey(
        assignmentData.id,
        selectedItem.id,
        user?.id
      );
      fetchFileContentFromStashAsync(fileKey).then((data) => {
        if (data) {
          setDefaultEditorValue(data.toString());
        }
      });
    }
  }, [
    selectedItem.id,
    assignmentData?.id,
    fetchFileContentFromStashAsync,
    user?.id,
  ]);

  const { mutate: saveFileInServer, isPending: isSaving } = useMutation({
    mutationKey: ['save-file-in-saver'],
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
        type: 'text/plain',
      });
      return FileSaverService.uploadFileToServer(file, Number(id));
    },
  });

  const { mutate: suspendUserFromAssignment } = useMutation({
    mutationFn: async () => {
      return AssignmentUserSuspensionService.suspendUserFromAssignment(
        Number(id),
        'window_focus'
      );
    },
  });

  React.useEffect(() => {
    if (id) {
      setTreeData(defaultTreeData);
    }
  }, [id]);

  const handleFileSelect = (node: FileNode) => {
    console.debug('File selected:', node);
    setSelectedItem({
      id: node.id,
      name: node.label,
      type: node.isFile ? 'file' : 'folder',
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

  if (isAssignmentLoading) {
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
          variant={'outline'}
        >
          Voltar
        </Button>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <WorkspaceAgreement
        title={assignmentData?.title ?? ''}
        onAccept={() => setCurrentStep(2)}
      />
    );
  }

  return (
    <div className="h-screen text-foreground flex flex-col">
      <WorkspaceHeader
        assignment={{
          title: assignmentData !== undefined ? assignmentData.title : '',
          description:
            assignmentData !== undefined ? assignmentData.description : '',
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
        <WorkspaceExplorer
          treeData={treeData}
          setFileTree={setTreeData}
          onFileSelect={handleFileSelect}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />

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
}
