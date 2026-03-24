import {
  saveFileTree,
  updateFileContent,
  getFileContent,
} from "@/app/integration/filestash";
import { useMutation } from "@tanstack/react-query";
import { FileNode } from "@/types/shared";
import { toast } from "./use-toast";


/**
 * Salva a árvore inteira de arquivos (útil para inicialização)
 */
const useSaveFileTree = () => {
  return useMutation({
    mutationKey: ["saveFileTree"],
    mutationFn: ({
      assignmentId,
      userId,
      fileTree,
    }: {
      assignmentId: number;
      userId: number;
      fileTree: FileNode;
    }) => {
      return saveFileTree(assignmentId, userId, fileTree);
    },
    onError: (error) => {
      toast({
        title: "Ocorreu um erro ao salvar os arquivos localmente",
        variant: "destructive",
      });
      console.error("Error during file tree save operation:", error);
    },
  });
};

/**
 * Atualiza apenas o conteúdo de um arquivo específico
 */
const useUpdateFileContent = () => {
  return useMutation({
    mutationKey: ["updateFileContent"],
    mutationFn: ({
      assignmentId,
      userId,
      filePath,
      content,
    }: {
      assignmentId: number;
      userId: number;
      filePath: string;
      content: string;
    }) => {
      return updateFileContent(assignmentId, userId, filePath, content);
    },
    onError: (error) => {
      toast({
        title: "Ocorreu um erro ao salvar o arquivo",
        variant: "destructive",
      });
      console.error("Error updating file content:", error);
    },
  });
};

/**
 * Busca o conteúdo de um arquivo específico (Mutation para controle manual)
 */
const useFetchFileContent = () => {
  return useMutation({
    mutationFn: async ({
      assignmentId,
      userId,
      filePath,
    }: {
      assignmentId: number;
      userId: number;
      filePath: string;
    }) => {
      return await getFileContent(assignmentId, userId, filePath);
    },
    onError: (error) => {
      console.error("Error fetching file content:", error);
    },
  });
};

export {
  useSaveFileTree,
  useUpdateFileContent,
  useFetchFileContent,
};
