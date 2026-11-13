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
import { WorkspaceViewControls, WorkspaceViewMode, WorkspaceMobilePane } from "./workspace-view-controls";
import { EDITOR_ACTION_GUARD_MODE } from "@/constants/editor-action-guard";
import { cn } from "@/lib/utils";
import WorkspaceImportControl from "./workspace-import-control";
import WorkspaceConflictDialog from "./workspace-conflict-dialog";
import { useWorkspaceSync } from "../_hooks/use-workspace-sync";
import dynamic from "next/dynamic";
import { WorkerType } from "@/app/interface/platform-api/worker";
import { previewEntries, previewFiles } from "@/lib/frontend-preview/sandbox";

const FrontendPreview = dynamic(
  () => import("@/components/editor/frontend-preview").then((module) => module.FrontendPreview),
  { ssr: false }
);

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
    registerTypedText
  } = useWorkspaceContext();
  const userId = user.userId;
  const { explorerWidth, startResize } = useWorskpaceResizing();
  const { mutateAsync: saveFileTreeAsync } = useSaveFileTree();
  const [, setActiveFileContent] = React.useState("");

  const paneId = React.useId();

  const [explorerOpen, setExplorerOpen] = React.useState(false);
  const [isSplitView, setIsSplitView] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [mobilePane, setMobilePane] = React.useState<WorkspaceMobilePane>(WorkspaceMobilePane.Code);
  const isReactPreview = assignment.workerType === WorkerType.NODE_REACTJS_CYPRESS;
  const canPreview = React.useMemo(
    () => previewEntries(
      previewFiles(fileTreeData), isReactPreview
    ).length > 0,
    [fileTreeData, isReactPreview]
  );
  const showPreview = isPreviewOpen && canPreview;
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

  const editorActionGuardMode = user.role === UserRole.ADMIN || user.role === UserRole.TEACHER
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
    setIsPreviewOpen(false);
    setExplorerOpen(false);
    setIsSplitView(true);
  }, []);

  const handleItemMoved = React.useCallback(
    (oldPath: string, newPath: string) => {
      setSecondarySelectedItem((current) => {
        if (!current) return current;
        const updatedPath = rebaseMovedPath(current.path, oldPath, newPath);
        if (updatedPath === current.path) return current;
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
    onDidType: registerTypedText
  };

  const viewMode: WorkspaceViewMode = showPreview
    ? WorkspaceViewMode.Preview
    : isSplitView ? WorkspaceViewMode.Split : WorkspaceViewMode.Single;

  const handleViewChange = (mode: WorkspaceViewMode) => {
    if (mode === WorkspaceViewMode.Preview) {
      setIsPreviewOpen((current) => !current);
      setMobilePane(WorkspaceMobilePane.Preview);
      setExplorerOpen(false);
      return;
    }

    setIsPreviewOpen(false);

    setIsSplitView(mode === WorkspaceViewMode.Split && (showPreview || !isSplitView));
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {conflict && (
        <WorkspaceConflictDialog
          {...conflict}
          actionGuardMode={editorActionGuardMode}
        />
      )}
      <div className="shrink-0 border-b border-border/25 px-3 py-1" role="status">
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
      <WorkspaceViewControls
        id={paneId}
        mode={viewMode}
        canPreview={canPreview}
        explorerOpen={explorerOpen}
        mobilePane={mobilePane}
        onModeChange={handleViewChange}
        onExplorerToggle={() => setExplorerOpen((current) => !current)}
        onMobilePaneChange={setMobilePane}
        onCloseSecondary={isSplitView && !showPreview && secondarySelectedItem ? () => {
          setSecondarySelectedItem(null);
          setIsSplitView(false);
        } : undefined}
      />
      <div className="flex min-h-0 min-w-0 flex-1">
        <aside
          id={`${paneId}-explorer`}
          aria-label="Arquivos do workspace"
          className={cn(
            "relative h-full min-h-0 max-w-[75%] shrink-0 flex-col border-r border-border/25 bg-card lg:flex lg:max-w-[400px]",
            explorerOpen ? "flex" : "hidden",
          )}
          style={{ width: explorerWidth }}
        >

          <WorkspaceImportControl assignment={assignment} user={user} />

          <WorkspaceExplorer
            onFileSelect={(node) => {
              handleFileSelect(node);
              setExplorerOpen(false);
              setMobilePane(WorkspaceMobilePane.Code);
            }}
            onTreeChange={handleTreeChange}
            onOpenInSecondary={handleOpenInSecondary}
            onItemMoved={handleItemMoved}
          />

          <div
            role="separator"
            aria-label="Redimensionar explorador"
            aria-orientation="vertical"
            className="absolute right-0 top-0 hidden h-full w-1 cursor-ew-resize bg-transparent transition-colors hover:bg-primary/40 lg:block"
            onMouseDown={(event) => startResize("explorer", event)}
          />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showPreview ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-border/25">
              <div
                id={`${paneId}-${WorkspaceMobilePane.Code}-panel`}
                aria-labelledby={`${paneId}-${WorkspaceMobilePane.Code}-tab`}
                className={cn("min-h-0 min-w-0 flex-col lg:flex", mobilePane === WorkspaceMobilePane.Code ? "flex" : "hidden")}
              >
                <WorkspaceCodeEditor
                  {...editorCommonProps}
                  file={activeFile}
                  onEditorChange={handleEditorChange}
                />
              </div>

              <div
                id={`${paneId}-${WorkspaceMobilePane.Preview}-panel`}
                aria-labelledby={`${paneId}-${WorkspaceMobilePane.Preview}-tab`}
                className={cn("min-h-0 min-w-0 flex-col lg:flex", mobilePane === WorkspaceMobilePane.Preview ? "flex" : "hidden")}
              >
                <FrontendPreview
                  dependencies={assignment.dependencies}
                  tree={fileTreeData}
                  react={isReactPreview}
                  paused={Boolean(assignment.currentUserAlertStatus?.suspended)}
                  blockContextMenu={user.role === UserRole.STUDENT}
                  onClose={() => setIsPreviewOpen(false)}
                />
              </div>
            </div>
          ) : isSplitView ? (

            <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border/25">
              <div className="flex min-h-0 min-w-0 flex-col">
                <WorkspaceCodeEditor
                  {...editorCommonProps}
                  file={activeFile}
                  onEditorChange={handleEditorChange}
                />
              </div>
              <div className="flex min-h-0 min-w-0 flex-col">
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
    </div>
  );
}
