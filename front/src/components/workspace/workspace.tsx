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
import { createDefaultFileNode } from "@/app/assignment/worker-templates";
import { WorkerType } from "@/app/interface/scheduler-api/worker";

interface WorkspaceProps {
  assignment: Assignment;
  user: Pick<User, "id" | "email" | "isAdmin">;
}

export default function Workspace({ assignment, user }: WorkspaceProps) {
  const [activeFileContent, setActiveFileContent] = React.useState("");
  const latestFileRequestIdRef = React.useRef(0);

  const { selectedItem, setSelectedItem, setFileTreeData } =
    useWorkspaceContext();

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
      language: selectedItem.id.split(".").pop() || "",
      value: activeFileContent,
    };
  }, [
    activeFileContent,
    selectedItem.id,
    selectedItem.path,
    selectedItem.type,
  ]);

  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const { mutateAsync: updateFileContentAsync } = useUpdateFileContent();
  const { mutateAsync: fetchFileContent } = useFetchFileContent();

  const getOrCreateFileTreeOnInit = useCallback(
    async (assignmentId: number, userId: number) => {
      let fileTree = await getFileTree(assignmentId, userId);
      let shouldPersistInitialState = false;

      const hasPath = (node: FileNode, expectedPath: string): boolean => {
        if (node.path === expectedPath) {
          return true;
        }

        if (!node.children?.length) {
          return false;
        }

        return node.children.some((child) => hasPath(child, expectedPath));
      };

      const shouldRebuildReactWorkspaceTree =
        assignment.workerType === WorkerType.NODE_REACTJS_CYPRESS &&
        (!fileTree ||
          !fileTree.children?.length ||
          !hasPath(fileTree, "src/App.tsx"));

      if (!fileTree || shouldRebuildReactWorkspaceTree) {
        const assignmentBoilerplate =
          assignment.boilerplateContent ?? assignment.boilerplate;

        // Create the correct file node based on assignment's worker type and boilerplate
        const defaultFileNode: FileNode = createDefaultFileNode(
          assignment.workerType as WorkerType,
          assignmentBoilerplate,
        );
        fileTree = defaultFileNode;
        shouldPersistInitialState = true;
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
        const assignmentBoilerplate =
          assignment.boilerplateContent ?? assignment.boilerplate;

        const firstFileContent =
          firstFile.content ?? assignmentBoilerplate ?? "";

        setSelectedItem({
          id: firstFile.id,
          type: "file",
          path: firstFile.path,
        });

        setActiveFileContent(firstFileContent);

        if (firstFile.content === undefined) {
          firstFile.content = firstFileContent;
          shouldPersistInitialState = true;
        }
      }

      if (shouldPersistInitialState) {
        await saveFileTreeAsync({
          assignmentId,
          userId,
          fileTree,
        });
      }

      return fileTree;
    },
    [
      setFileTreeData,
      assignment.boilerplateContent,
      assignment.boilerplate,
      assignment.workerType,
      saveFileTreeAsync,
      setSelectedItem,
    ],
  );

  // Inicializa a árvore no stash quando carrega o assignment
  React.useEffect(() => {
    getOrCreateFileTreeOnInit(assignment.id, user.id);
  }, [assignment.id, getOrCreateFileTreeOnInit, user.id]);

  const handleFileSelect = async (node: FileNode) => {
    if (node.isFile) {
      const requestId = ++latestFileRequestIdRef.current;

      setSelectedItem({
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
    } else {
      latestFileRequestIdRef.current += 1;
      setSelectedItem({
        id: node.id,
        type: "folder",
        path: node.path,
      });
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile?.path) {
      void updateFileContentAsync({
        assignmentId: assignment.id,
        userId: user.id,
        filePath: activeFile.path,
        content: value,
      });

      setActiveFileContent(value);
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
    [assignment.id, saveFileTreeAsync, setFileTreeData, user.id],
  );

  return (
    <div className="flex flex-1 min-h-0">
      <WorkspaceExplorer
        onFileSelect={handleFileSelect}
        onTreeChange={handleTreeChange}
      />

      <div className="flex-1 flex flex-col">
        <WorkspaceCodeEditor
          file={activeFile}
          onEditorChange={handleEditorChange}
        />
      </div>
    </div>
  );
}
