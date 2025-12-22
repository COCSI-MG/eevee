"use client";

import {
  useFetchFileContent,
  useSaveFileTree,
  useUpdateFileContent,
} from "@/hooks/use-filestash";
import { FileNode } from "@/types/shared";
import React, { useCallback } from "react";
import WorkspaceCodeEditor from "./workspace-code-editor";
import WorkspaceExplorer from "./workspace-explorer";
import { useWorkspaceContext } from "./workspace-provider";
import { getFileTree } from "@/app/integration/filestash";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { User } from "@/app/interface/scheduler-api/user";
import {
  WORKER_FILE_BASE_NODE,
} from "@/app/assignment/[id]/workspace/worker-templates";

interface WorkspaceProps {
  assignment: Assignment;
  user: Pick<User, "id" | "email" | "isAdmin">;
}

export default function Workspace({ assignment, user }: WorkspaceProps) {
  const [activeFile, setActiveFile] = React.useState<{
    name: string;
    language: string;
    value: string;
  } | null>(null);

  const { selectedItem, setSelectedItem, setFileTreeData } =
    useWorkspaceContext();

  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const { mutate: updateFileContent } = useUpdateFileContent();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const getOrCreateFileTreeOnInit = useCallback(
    async (assignmentId: number, userId: number) => {
      let fileTree = await getFileTree(assignmentId, userId);
      if (!fileTree) {
        const workerType =
          assignment.workerType as keyof typeof WORKER_FILE_BASE_NODE;
        const defaultNodeForWorkerType = WORKER_FILE_BASE_NODE[workerType];
        const defaultFileNode: FileNode = JSON.parse(
          JSON.stringify(defaultNodeForWorkerType)
        );

        await saveFileTreeAsync({
          assignmentId,
          userId,
          fileTree: defaultFileNode,
        });
        fileTree = defaultFileNode;
      }

      setFileTreeData(fileTree);

      const findFirst = (node: FileNode): FileNode | null => {
        if (node.isFile) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findFirst(child);
            if (found) return found;
          }
        }
        return null;
      };

      const firstFile = findFirst(fileTree);
      if (firstFile) {
        setSelectedItem({
          id: firstFile.id,
          name: firstFile.label,
          type: "file",
          path: firstFile.path,
        });

        setActiveFile({
          name: firstFile.label,
          language: firstFile.label.split(".").pop() || "",
          value: firstFile.content || assignment.boilerplate || "",
        });
      }

      return fileTree;
    },
    [
      setFileTreeData,
      assignment.workerType,
      assignment.boilerplate,
      saveFileTreeAsync,
      setSelectedItem,
    ]
  );

  // Inicializa a árvore no stash quando carrega o assignment
  React.useEffect(() => {
    getOrCreateFileTreeOnInit(assignment.id, user.id);
  }, [assignment.id, getOrCreateFileTreeOnInit, user.id]);

  const handleFileSelect = async (node: FileNode) => {
    setSelectedItem({
      id: node.id,
      name: node.label,
      type: node.isFile ? "file" : "folder",
      path: node.path,
    });

    if (!node.isFile) return;

    const content = await fetchFileContent({
      assignmentId: assignment.id,
      userId: user.id,
      filePath: node.path,
    });

    setActiveFile({
      name: node.label,
      language: node.label.split(".").pop() || "",
      value: content || "",
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && selectedItem.path) {
      console.log("Updating file content for", selectedItem.path);
      updateFileContent({
        assignmentId: assignment.id,
        userId: user.id,
        filePath: selectedItem.path,
        content: value,
      });

      setActiveFile({
        name: selectedItem.name,
        language: selectedItem.name.split(".").pop() || "",
        value: value,
      });
    }
  };

  const handleTreeChange = useCallback(
    async (newTree: FileNode) => {
      if (assignment.id && user?.id) {
        console.log("Saving updated file tree");
        setFileTreeData(newTree);
        await saveFileTreeAsync({
          assignmentId: assignment.id,
          userId: user.id,
          fileTree: newTree,
        });
      }
    },
    [assignment.id, saveFileTreeAsync, setFileTreeData, user.id]
  );

  return (
    <div className="flex flex-1 min-h-0">
      <WorkspaceExplorer
        onFileSelect={handleFileSelect}
        onTreeChange={handleTreeChange}
      />

      <div className="flex-1 flex flex-col">
        <WorkspaceCodeEditor
          file={activeFile!}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
