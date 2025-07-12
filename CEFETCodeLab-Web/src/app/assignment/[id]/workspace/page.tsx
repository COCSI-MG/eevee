"use client";

import type React from "react";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { SchedulingService } from "@/app/integration/scheduler-api/scheduling";
import { toast } from "@/hooks/use-toast";
import WorkspaceHeader from "@/components/workspace/header";
import WorkspaceExplorer from "@/components/workspace/explorer";
import WorkspaceEditor from "@/components/workspace/editor";
import WorkspaceConsole from "@/components/workspace/console";
import { FileType } from "@/types/shared";
import {
  upsertFileInStash,
} from "@/app/integration/filestash";
import { getFilePath } from "@/lib/file-path-utils";
import { useAuthUser } from "@/hooks/use-auth-user";
import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { usePreventUserActions } from "@/hooks/use-prevent-user-actions";
import { useFetchAssignment } from "@/hooks/use-assignments";
import { useWindowFocus } from "@/hooks/use-window-focus";
import { useFileStash } from "@/hooks/use-filestash";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";
import WindowFocusDialog from "@/components/window-focus-dialog";
import { useWorkspace } from "@/hooks/use-workspace";

export default function AssignmentWorkspace() {
  const { id } = useParams();

  const { explorerWidth, consoleHeight, startResize } = useWorskpaceResizing();
  const {
    fileStructure,
    setFileStructure,
    newItem,
    setNewItem,
    setConsoleOutput,
    activeFile,
    setActiveFile,
    activeFileContent,
    setActiveFileContent,
    activeLocalFilePath,
    newItemRef,
    getFileStruct,
    getFileContentFromStash
  } = useWorkspace();

  const { focusCount, resetFocusCount } = useWindowFocus();

  const { user } = useAuthUser();
  const { data: assignment, isLoading } = useFetchAssignment(Number(id));

  usePreventUserActions();
  useFileStash();

  const {
    mutate: submitAssignment,
    isPending,
    data: workerResult,
  } = useMutation({
    mutationKey: ["submit-assignment"],
    mutationFn: () => {
      return SchedulingService.createScheduling({
        assignmentId: Number(id),
        applicationFileContent: activeFileContent,
      });
    },
    onError: (error) => {
      console.error("Error submitting assignment:", error);
      setConsoleOutput((prev) => [
        ...prev,
        "Error: Ocorreu um erro ao submeter a tarefa.",
      ]);
    },
  });

  const {
    mutate: saveFileInStash,
    isPending: isSaving,
    isError: isSavingError,
    data: savedFile,
  } = useMutation({
    mutationKey: ["save-file"],
    mutationFn: (activeFileStructure: FileType) => {
      if (!assignment) {
        console.error("No assignment data available");
        return Promise.reject("No assignment data available");
      }

      const filePath = getFilePath(activeFileStructure, fileStructure);
      const key = `${assignment.id}/${activeFileStructure.id}/${filePath}`;
      console.log("activeFileContent:", activeFileContent);
      return upsertFileInStash(
        {
          name: filePath,
          data: activeFileContent,
          size: activeFileContent.length,
          createdAt: new Date().toISOString(),
          updateAt: new Date().toISOString(),
        },
        key
      );
    },
  });

  const { mutate: saveFileAtServer, isPending: isSavingAtServer } = useMutation(
    {
      mutationKey: ["save-file-at-server"],
      mutationFn: (file: File) => {
        if (!assignment) {
          console.error("No assignment data available");
          return Promise.reject("No assignment data available");
        }
        if (!user) {
          console.error("No user data available");
          return Promise.reject("No user data available");
        }
        return FileSaverService.uploadFileToServer(
          file,
          Number(assignment.id),
          Number(user.id)
        );
      },
    }
  );

  useEffect(() => {
    if (!isPending && workerResult) {
      console.log("Worker result:", workerResult);
      setConsoleOutput((prev) => [
        ...prev,
        `> Score: ${workerResult.score}`,
        `> Passes: ${workerResult.passes}`,
        `> Fails: ${workerResult.fails}`,
        `Report: ${workerResult.report.replace(/\\n/g, "\n")}`,
      ]);
    }
  }, [isPending, setConsoleOutput, workerResult]);

  useEffect(() => {
    if (newItem.isCreating && newItemRef.current) {
      setTimeout(() => {
        newItemRef.current?.focus();
      }, 0);
    }
  }, [newItem.isCreating, newItemRef]);

  useEffect(() => {
    const localStorageFileStructure = localStorage.getItem(
      `file-Structure-assignment-${id}`
    );
    if (localStorageFileStructure) {
      const parsedFileStructure = JSON.parse(localStorageFileStructure);
      setFileStructure(parsedFileStructure);
    }
  }, [id, setFileStructure]);

  useEffect(() => {
    localStorage.setItem(
      `file-Structure-assignment-${id}`,
      JSON.stringify(fileStructure)
    );
  }, [fileStructure, id]);

  useEffect(() => {
    if (isSavingError) {
      console.error("Error saving file:", savedFile);
      toast({
        title: "Erro ao salvar o arquivo",
        description: "Ocorreu um erro ao salvar o arquivo.",
        variant: "destructive",
      });
      return;
    }
    if (!isSaving && savedFile) {
      toast({
        title: "Arquivo salvo com sucesso",
        variant: "default",
      });
    }
  }, [savedFile, isSaving, isSavingError]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const updatedStructure = [...fileStructure];
      // Find and update the file content by path
      const updateFileContent = (items: FileType[]): boolean => {
        for (const item of items) {
          // Check if this is the active file by comparing paths
          if (
            item.type === "file" &&
            getFilePath(item, fileStructure) === activeFile
          ) {
            item.lastModified = new Date();
            return true;
          }

          // Recursively search children
          if (item.children && updateFileContent(item.children)) {
            return true;
          }
        }
        return false;
      };

      updateFileContent(updatedStructure);
      setFileStructure(updatedStructure);
      setActiveFileContent(value);
    }
  };

  useEffect(() => {
    if (activeLocalFilePath && assignment && activeFileContent === "") {
      const fileStruct = getFileStruct(activeLocalFilePath);
      if (!fileStruct) {
        console.error(
          "File structure not found for path:",
          activeLocalFilePath
        );
        return;
      }
      const fileKey = `${assignment.id}/${fileStruct.id}/${activeLocalFilePath}`;
      getFileContentFromStash(fileKey);
    }
  }, [activeFileContent, activeLocalFilePath, assignment, getFileContentFromStash, getFileStruct]);

  const handleRun = () => {
    if (activeFileContent === "") {
      toast({
        title: "Erro",
        description: "O arquivo está vazio.",
        variant: "destructive",
      });
      return;
    }
    setConsoleOutput(["Enviando para teste..."]);
    submitAssignment();
  };

  const handleFileLocalSave = () => {
    const struct = getFileStruct(activeLocalFilePath);
    if (!struct) {
      console.error("Error getting struct");
      return;
    }
    saveFileInStash(struct);
  };

  const handleSave = () => {
    if (activeFileContent === "") {
      toast({
        title: "Erro",
        description: "O arquivo está vazio.",
        variant: "destructive",
      });
      return;
    }
    saveFileAtServer(
      new File([activeFileContent], activeLocalFilePath, {
        type: "text/plain",
      })
    );
  };

  const cleanActiveFileAndContent = () => {
    setActiveFile("");
    setActiveFileContent("");
  };

  if (isLoading || !assignment) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        <span className="ml-4 text-lg">Carregando...</span>
      </div>
    );
  }

  return (
    <>
      <WorkspaceHeader assignmentDescription={assignment.description} />

      {focusCount === 5 && (
        <WindowFocusDialog onClick={() => resetFocusCount()} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden explorer-panel">
            <WorkspaceExplorer
              explorerWidth={explorerWidth}
              fileStructure={fileStructure}
              startResize={startResize}
              activeFile={activeFile}
              newItem={newItem}
              setNewItem={setNewItem}
              cleanActiveFileAndContent={cleanActiveFileAndContent}
              setFileStructure={setFileStructure}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <WorkspaceEditor
                activeFile={activeFile}
                activeFileContent={activeFileContent}
                handleEditorChange={handleEditorChange}
                handleRun={handleRun}
                isPending={isPending}
                handleSave={handleSave}
                isSavingAtServer={isSavingAtServer}
                handleLocalSave={handleFileLocalSave}
              />
              <WorkspaceConsole
                consoleHeight={consoleHeight}
                startResize={startResize}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
