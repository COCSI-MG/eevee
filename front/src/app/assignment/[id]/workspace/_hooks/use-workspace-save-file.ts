"use client";

import FileSaverService from "@/app/integration/scheduler-api/file-saver";
import { useWorkspaceContext } from "@/app/assignment/[id]/workspace/_providers/workspace-provider";
import { useFetchFileContent } from "@/hooks/use-filestash";
import { useMutation } from "@tanstack/react-query";

interface UseWorkspaceSaveFileParams {
  assignmentId?: number;
  userId?: number;
}

export function useWorkspaceSaveFile({
  assignmentId,
  userId,
}: UseWorkspaceSaveFileParams) {
  const { selectedItem } = useWorkspaceContext();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const { mutate: saveFileInServer, isPending: isSaving } = useMutation({
    mutationKey: ["save-file-in-saver"],
    mutationFn: async () => {
      if (!assignmentId || !userId || !selectedItem.path) {
        throw new Error("Missing required data");
      }

      const fileContent = await fetchFileContent({
        assignmentId,
        userId,
        filePath: selectedItem.path,
      });

      if (fileContent == null) {
        throw new Error("File content is empty");
      }

      const file = new File([fileContent], selectedItem.id, {
        type: "text/plain",
      });

      return FileSaverService.uploadFileToServer(file, assignmentId);
    },
  });

  return {
    isSaving,
    saveFileInServer,
  };
}
