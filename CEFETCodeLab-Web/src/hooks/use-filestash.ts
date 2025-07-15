import {
  getFileFromStash,
  initStash,
  upsertFileInStash,
} from "@/app/integration/filestash";
import { useMutation } from "@tanstack/react-query";
import { FileStrucutre } from "filestash";
import { useEffect } from "react";
import { toast } from "./use-toast";

const useFileStash = () => {
  useEffect(() => {
    const initializeStashFn = async () => {
      try {
        await initStash();
      } catch (err) {
        console.error("Error initializing Filestash:", err);
      }
    };
    initializeStashFn();
  }, []);
};

const useSaveInFileStash = () => {
  return useMutation({
    mutationKey: ["saveFileInStash"],
    mutationFn: ({
      fileData,
      fileKey,
    }: {
      fileData: FileStrucutre;
      fileKey: string;
    }) => {
      return upsertFileInStash(fileData, fileKey);
    },
    onError: (error) => {
      toast({
        title: "Ocorreu um erro ao salvar o arquivo localmente",
        variant: "destructive"
      })
      console.error("Error during file save operation:", error);
    },
  });
};

const useFetchFromStash = () => {
  return useMutation({
    mutationFn: async (fileKey: string) => {
      const fileData = await getFileFromStash(fileKey);
      return fileData.data;
    },
    onError: (error) => {
      toast({
        title: "Ocorreu um erro ao carregar arquivo localmente",
        variant: "destructive"
      })
      console.error("Error while fetching content from stash", error);
    },
    onSuccess: (data) => {
      console.log(data);
    }
  });
};

export { useFileStash, useSaveInFileStash, useFetchFromStash };
