"use client";

import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { User } from "@/app/interface/scheduler-api/user";
import {
  useFetchFileContent,
  useUpdateFileContent,
} from "@/hooks/use-filestash";
import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import { getFileLanguage } from "../_utils/workspace.utils";

interface UseActiveWorkspaceFileParams {
  assignment: Assignment;
  user: Pick<User, "id" | "email" | "isAdmin">;
  selectedItem: SelectedItem;
  selectItem: (item: SelectedItem) => void;
}

export function useActiveWorkspaceFile({
  assignment,
  user,
  selectedItem,
  selectItem,
}: UseActiveWorkspaceFileParams) {
  const [activeFileContent, setActiveFileContent] = React.useState("");
  const latestFileRequestIdRef = React.useRef(0);

  const { mutateAsync: updateFileContentAsync } = useUpdateFileContent();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const activeFile = React.useMemo(() => {
    if (
      selectedItem.type !== "file" ||
      !selectedItem.path ||
      !selectedItem.id
    ) {
      return null;
    }

    return {
      name: selectedItem.id,
      path: selectedItem.path,
      language: getFileLanguage(selectedItem.id),
      value: activeFileContent,
    };
  }, [
    activeFileContent,
    selectedItem.id,
    selectedItem.path,
    selectedItem.type,
  ]);

  const handleFileSelect = React.useCallback(
    async (node: FileNode) => {
      if (node.isFile) {
        const requestId = ++latestFileRequestIdRef.current;

        selectItem({
          id: node.id,
          type: "file",
          path: node.path,
        });

        const content = await fetchFileContent({
          assignmentId: assignment.id,
          userId: user.id,
          filePath: node.path,
        });

        if (requestId !== latestFileRequestIdRef.current) {
          return;
        }

        setActiveFileContent(content || "");
        return;
      }

      latestFileRequestIdRef.current += 1;
      selectItem({
        id: node.id,
        type: "folder",
        path: node.path,
      });
    },
    [assignment.id, fetchFileContent, selectItem, user.id],
  );

  const handleEditorChange = React.useCallback(
    (value: string | undefined) => {
      if (value !== undefined && activeFile?.path) {
        void updateFileContentAsync({
          assignmentId: assignment.id,
          userId: user.id,
          filePath: activeFile.path,
          content: value,
        });

        setActiveFileContent(value);
      }
    },
    [activeFile?.path, assignment.id, updateFileContentAsync, user.id],
  );

  return {
    activeFile,
    handleEditorChange,
    handleFileSelect,
    setActiveFileContent,
  };
}
