"use client";

import { DEFAULT_ASSIGNMENT_TEMPLATE } from "@/app/admin/assignments/constants";
import {
  useSaveFileTree,
  useUpdateFileContent,
  useFetchFileContent,
} from "@/hooks/use-filestash";
import { FileNode } from "@/types/shared";
import React, { useCallback } from "react";
import WorkspaceCodeEditor from "./workspace-code-editor";
import WorkspaceExplorer from "./workspace-explorer";
import { useWorkspaceContext } from "./workspace-provider";
import { getFileTree } from "@/app/integration/filestash";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { User } from "@/app/interface/scheduler-api/user";

const defaultFileNode: FileNode[] = [
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

interface WorkspaceProps {
  assignment: Assignment;
  user: Pick<User, "id" | "email" | "isAdmin">;
}

export default function Workspace({ assignment, user }: WorkspaceProps) {
  const [defaultEditorValue] = React.useState<string>(
    DEFAULT_ASSIGNMENT_TEMPLATE
  );
  const [currentFileContent, setCurrentFileContent] =
    React.useState<string>("");

  const { selectedItem, setSelectedItem, setFileTreeData } =
    useWorkspaceContext();

  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const { mutate: updateFileContent, mutateAsync: updateFileContentAsync } =
    useUpdateFileContent();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const getOrCreateFileTreeOnInit = useCallback(
    async (assignmentId: number, userId: number) => {
      let fileTree = await getFileTree(assignmentId, userId);
      if (!fileTree) {
        await saveFileTreeAsync({
          assignmentId,
          userId,
          fileTree: defaultFileNode,
        });
        fileTree = defaultFileNode;

        await updateFileContentAsync({
          assignmentId,
          userId,
          filePath: defaultFileNode[0].children?.[0].path || "",
          content: defaultEditorValue,
        });
      }

      setFileTreeData(fileTree);

      const findFirst = (nodes: FileNode[]): FileNode | null => {
        for (const node of nodes) {
          if (node.isFile) return node;
          if (node.children) {
            const found = findFirst(node.children);
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
      }

      return fileTree;
    },
    [
      setFileTreeData,
      saveFileTreeAsync,
      updateFileContentAsync,
      defaultEditorValue,
      setSelectedItem,
    ]
  );

  // Inicializa a árvore no stash quando carrega o assignment
  React.useEffect(() => {
    getOrCreateFileTreeOnInit(assignment.id, user.id);
  }, [assignment.id, getOrCreateFileTreeOnInit, user.id]);

  // Carrega o conteúdo do arquivo selecionado
  React.useEffect(() => {
    if (selectedItem.path) {
      console.log("Fetching file content for", selectedItem.path);
      fetchFileContent({
        assignmentId: assignment.id,
        userId: user.id,
        filePath: selectedItem.path,
      }).then((content) => {
        setCurrentFileContent(content || defaultEditorValue);
      });
    }
  }, [
    selectedItem.path,
    user.id,
    fetchFileContent,
    defaultEditorValue,
    assignment.id,
  ]);

  const handleFileSelect = (node: FileNode) => {
    setSelectedItem({
      id: node.id,
      name: node.label,
      type: node.isFile ? "file" : "folder",
      path: node.path,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (
      value !== undefined &&
      selectedItem.path
    ) {
      console.log("Updating file content for", selectedItem.path);
      updateFileContent({
        assignmentId: assignment.id,
        userId: user.id,
        filePath: selectedItem.path,
        content: value,
      });
      setCurrentFileContent(value);
    }
  };

  const handleTreeChange = useCallback(
    async (newTree: FileNode[]) => {
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
          activeFile={selectedItem.name}
          editorValue={currentFileContent}
          editorDefaultValue={defaultEditorValue}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
