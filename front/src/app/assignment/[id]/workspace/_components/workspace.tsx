"use client";

import React from "react";
import WorkspaceCodeEditor from "./workspace-code-editor";
import WorkspaceExplorer from "./workspace-explorer";
import WorkspaceQuestionPanel from "./workspace-question-panel";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import { Assignment } from "@/app/interface/scheduler-api/assignment";
import { useWorkspaceInitialization } from "../_hooks/use-workspace-initialization";
import { useWorkspaceFileEditor } from "../_hooks/use-workspace-file-editor";
import { useWorkspaceTreeActions } from "../_hooks/use-workspace-tree-actions";
import { AuthSession } from "@/app/interface/scheduler-api/auth";
import { useWorkspaceReset } from "../_hooks/use-workspace-reset";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";
import { FileNode, SelectedItem } from "@/types/shared";
import { updateFileContent, findNodeByPath } from "../_utils/workspace-tree.utils";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { Button } from "@/components/ui/button";

interface WorkspaceProps {
  assignment: Assignment;
  user: AuthSession;
  onResetWorkspaceReady?: (
    resetWorkspace: ((assignment?: Assignment) => Promise<void>) | null,
  ) => void;
  onResettingChange?: (isResetting: boolean) => void;
}

export default function Workspace({
  assignment,
  user,
  onResetWorkspaceReady,
  onResettingChange,
}: WorkspaceProps) {
  const { replaceFileTree, selectedItem, selectItem, fileTreeData } =
    useWorkspaceContext();
  const userId = user.userId;
  const { explorerWidth, startResize } = useWorskpaceResizing();
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const [, setActiveFileContent] = React.useState("");
  const [isSplitView, setIsSplitView] = React.useState(false);
  const [secondarySelectedItem, setSecondarySelectedItem] =
    React.useState<SelectedItem | null>(null);

  const { activeFile, handleEditorChange, handleFileSelect } =
    useWorkspaceFileEditor({
      selectedItem,
      selectItem,
      onTreeChange: async (tree) => {
        await saveFileTreeAsync({
          assignmentId: assignment.id,
          userId: user.userId,
          fileTree: tree,
        });
      },
    });

  const { handleTreeChange } = useWorkspaceTreeActions({
    assignment,
    user,
  });

  const secondaryFile = React.useMemo(() => {
    if (!secondarySelectedItem?.path || secondarySelectedItem.type !== "file") {
      return null;
    }

    const fileNode = findNodeByPath(fileTreeData, secondarySelectedItem.path);
    if (!fileNode || !fileNode.isFile) {
      return null;
    }

    return {
      name: fileNode.id,
      path: fileNode.path,
      language: fileNode.id.split(".").pop() || "",
      value: fileNode.content || "",
    };
  }, [fileTreeData, secondarySelectedItem]);

  const handleSecondaryEditorChange = React.useCallback(
    (value: string | undefined) => {
      if (value === undefined || !secondaryFile?.path) {
        return;
      }

      const updatedTree = updateFileContent(
        fileTreeData,
        secondaryFile.path,
        value,
      );
      if (updatedTree === fileTreeData) {
        return;
      }

      replaceFileTree(updatedTree);

      void saveFileTreeAsync({
        assignmentId: assignment.id,
        userId: user.userId,
        fileTree: updatedTree,
      });
    },
    [
      assignment.id,
      fileTreeData,
      replaceFileTree,
      saveFileTreeAsync,
      secondaryFile?.path,
      user.userId,
    ],
  );

  const handleOpenInSecondary = React.useCallback((node: FileNode) => {
    if (!node.isFile) {
      return;
    }

    setSecondarySelectedItem({
      id: node.id,
      type: "file",
      path: node.path,
    });
    setIsSplitView(true);
  }, []);

  React.useEffect(() => {
    if (!secondarySelectedItem?.path) {
      return;
    }

    const exists = Boolean(
      findNodeByPath(fileTreeData, secondarySelectedItem.path),
    );
    if (!exists) {
      setSecondarySelectedItem(null);
      setIsSplitView(false);
    }
  }, [fileTreeData, secondarySelectedItem]);

  const { isResetting, resetWorkspace } = useWorkspaceReset({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });

  useWorkspaceInitialization({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });

  React.useEffect(() => {
    onResetWorkspaceReady?.(resetWorkspace);

    return () => {
      onResetWorkspaceReady?.(null);
    };
  }, [onResetWorkspaceReady, resetWorkspace]);

  React.useEffect(() => {
    onResettingChange?.(isResetting);
  }, [isResetting, onResettingChange]);

  return (
    <div className="flex flex-1 min-h-0">
      <div
        className="relative shrink-0 min-w-[150px] max-w-[400px] bg-gray-800 border-r border-gray-700 h-full min-h-0"
        style={{ width: explorerWidth }}
      >
        <WorkspaceExplorer
          onFileSelect={handleFileSelect}
          onTreeChange={handleTreeChange}
          onOpenInSecondary={handleOpenInSecondary}
        />

        <div
          role="separator"
          aria-label="Redimensionar explorador"
          aria-orientation="vertical"
          className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent transition-colors hover:bg-blue-500/40"
          onMouseDown={(event) => startResize("explorer", event)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <WorkspaceQuestionPanel
          title={assignment.title}
          description={assignment.description}
        />
        <div className="flex items-center justify-end gap-2 border-b border-gray-800 px-2 py-1">
          {isSplitView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSecondarySelectedItem(null)}
                disabled={!secondarySelectedItem}
              >
                Fechar página 2
              </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSplitView((current) => !current)}
          >
            {isSplitView ? "Página única" : "Duas páginas"}
          </Button>
        </div>

        {isSplitView ? (
          <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-gray-800">
            <div className="min-w-0 min-h-0 flex flex-col">
              <WorkspaceCodeEditor
                file={activeFile}
                onEditorChange={handleEditorChange}
              />
            </div>
            <div className="min-w-0 min-h-0 flex flex-col">
              <WorkspaceCodeEditor
                file={secondaryFile}
                onEditorChange={handleSecondaryEditorChange}
              />
            </div>
          </div>
        ) : (
          <WorkspaceCodeEditor
            file={activeFile}
            onEditorChange={handleEditorChange}
          />
        )}
      </div>
    </div>
  );
}
