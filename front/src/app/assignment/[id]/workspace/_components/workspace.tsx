"use client";
import { UserRole } from "@/app/interface/platform-api/user";

import React from "react";
import { Cloud, CloudAlert, CloudUpload } from "lucide-react";
import WorkspaceCodeEditor from "./workspace-code-editor";
import WorkspaceExplorer from "./workspace-explorer";
import { useWorkspaceContext } from "../_providers/workspace-provider";
import { Assignment } from "@/app/interface/platform-api/assignment";
import { useWorkspaceFileEditor } from "../_hooks/use-workspace-file-editor";
import { useWorkspaceTreeActions } from "../_hooks/use-workspace-tree-actions";
import { useWorkspaceInitialization } from "../_hooks/use-workspace-initialization";
import { AuthSession } from "@/app/interface/platform-api/auth";
import { useWorkspaceReset } from "../_hooks/use-workspace-reset";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";
import { FileNode, SelectedItem } from "@/types/shared";
import {
  updateFileContent,
  findNodeByPath,
  rebaseMovedPath,
} from "../_utils/workspace-tree.utils";
import { useSaveFileTree } from "@/hooks/use-filestash";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EDITOR_ACTION_GUARD_MODE } from "@/constants/editor-action-guard";
import { cn } from "@/lib/utils";
import WorkspaceImportControl from "./workspace-import-control";
import WorkspaceConflictDialog from "./workspace-conflict-dialog";
import { useWorkspaceSync } from "../_hooks/use-workspace-sync";

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
  const {
    replaceFileTree,
    selectedItem,
    selectItem,
    fileTreeData,
    securityPaused,
    registerTypedText
  } = useWorkspaceContext();
  const userId = user.userId;
  const { explorerWidth, startResize } = useWorskpaceResizing();
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const [, setActiveFileContent] = React.useState("");
  const [isSplitView, setIsSplitView] = React.useState(false);
  const [secondarySelectedItem, setSecondarySelectedItem] =
    React.useState<SelectedItem | null>(null);

  const { isInitialized, conflict } = useWorkspaceInitialization({
    assignment,
    userId,
    setActiveFileContent,
    replaceFileTree,
    selectItem,
  });
  const sourceSync = useWorkspaceSync(
    assignment.id,
    userId,
    fileTreeData,
    isInitialized,
  );
  const sourceSaved = sourceSync.status === "saved";
  const SourceSyncIcon = sourceSaved ? Cloud : CloudUpload;

  const editorActionGuardMode = user.role === UserRole.ADMIN
    ? EDITOR_ACTION_GUARD_MODE.EXEMPT
    : assignment.allowCopyPaste
      ? EDITOR_ACTION_GUARD_MODE.INTERNAL_ONLY
      : EDITOR_ACTION_GUARD_MODE.ENFORCED;

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

  const handleItemMoved = React.useCallback(
    (oldPath: string, newPath: string) => {
      setSecondarySelectedItem((current) => {

        if (!current) return current

        const updatedPath = rebaseMovedPath(current.path, oldPath, newPath);

        if (updatedPath === current.path) return current

        return {
          ...current,
          id: updatedPath.split("/").pop() || current.id,
          path: updatedPath,
        };
      });
    },
    [],
  );

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

  React.useEffect(() => {
    onResetWorkspaceReady?.(resetWorkspace);

    return () => {
      onResetWorkspaceReady?.(null);
    };
  }, [onResetWorkspaceReady, resetWorkspace]);

  React.useEffect(() => {
    onResettingChange?.(isResetting);
  }, [isResetting, onResettingChange]);

  const editorCommonProps = {
    actionGuardMode: editorActionGuardMode,
    readOnly: securityPaused,
    onDidType: registerTypedText
  };

  return (
    <div className="flex flex-1 min-h-0">
      {conflict && (
        <WorkspaceConflictDialog
          {...conflict}
          actionGuardMode={editorActionGuardMode}
        />
      )}
      <div
        className="relative flex shrink-0 min-w-[150px] max-w-[400px] flex-col bg-card border-r border-border h-full min-h-0"
        style={{ width: explorerWidth }}
      >
        <WorkspaceImportControl
          assignment={assignment}
          user={user}
        />

        <WorkspaceExplorer
          onFileSelect={handleFileSelect}
          onTreeChange={handleTreeChange}
          onOpenInSecondary={handleOpenInSecondary}
          onItemMoved={handleItemMoved}
        />

        <div
          role="separator"
          aria-label="Redimensionar explorador"
          aria-orientation="vertical"
          className="absolute right-0 top-0 h-full w-1 cursor-ew-resize bg-transparent transition-colors hover:bg-primary/40"
          onMouseDown={(event) => startResize("explorer", event)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-end gap-2 border-b border-border px-2 py-1">
          <div className="mr-auto" role="status">
            {sourceSync.status === "error" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title={sourceSync.error}
                onClick={sourceSync.retry}
                className="h-auto gap-1.5 whitespace-normal rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-left font-semibold text-destructive hover:bg-destructive/20 hover:text-destructive"
              >
                <CloudAlert aria-hidden="true" />
                Falha ao sincronizar · Tentar novamente
              </Button>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 rounded-full py-1",
                  sourceSaved
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border/50 bg-muted text-muted-foreground",
                )}
              >
                <SourceSyncIcon aria-hidden="true" className="size-4 shrink-0" />
                {sourceSaved ? "Salvo no servidor" : "Salvando no servidor…"}
              </Badge>
            )}
          </div>
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
          <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-border">
            <div className="min-w-0 min-h-0 flex flex-col">
              <WorkspaceCodeEditor
                {...editorCommonProps}
                file={activeFile}
                onEditorChange={handleEditorChange}
              />
            </div>
            <div className="min-w-0 min-h-0 flex flex-col">
              <WorkspaceCodeEditor
                {...editorCommonProps}
                file={secondaryFile}
                onEditorChange={handleSecondaryEditorChange}
              />
            </div>
          </div>
        ) : (
          <WorkspaceCodeEditor
            {...editorCommonProps}
            file={activeFile}
            onEditorChange={handleEditorChange}
          />
        )}
      </div>
    </div>
  );
}
