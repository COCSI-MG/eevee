import * as React from "react";
import type { editor } from "monaco-editor";

import type { WorkerType } from "@/app/interface/scheduler-api/worker";
import {
  type EditorActionGuardMode,
  registerEditorActionGuard,
} from "@/hooks/user-actions/editor-action-guard";
import { registerWorkspaceRuntime } from "@/lib/monaco/workspace/runtime";
import type { FileNode } from "@/types/shared";

import type { MonacoEditorPreset } from "./monaco-code-editor.types";

type WorkspaceRuntime = ReturnType<typeof registerWorkspaceRuntime>;
type MonacoEditorMountHandler = (
  editorInstance: editor.IStandaloneCodeEditor,
  monaco: typeof import("monaco-editor"),
) => void;

interface UseMonacoEditorLifecycleOptions {
  preset: MonacoEditorPreset;
  path?: string;
  workerType?: WorkerType | string;
  workspaceTree?: FileNode;
  actionGuardMode: EditorActionGuardMode;
  actionGuardScope?: string;
}

const BLOCKED_EDITOR_DRAG_EVENTS = [
  "dragstart",
  "dragenter",
  "dragover",
  "drop",
] as const;

function blockEditorDragAction(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
  return false;
}

export function useMonacoEditorLifecycle({
  preset,
  path,
  workerType,
  workspaceTree,
  actionGuardMode,
  actionGuardScope,
}: UseMonacoEditorLifecycleOptions): MonacoEditorMountHandler {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const runtimeRef = React.useRef<WorkspaceRuntime | null>(null);
  const actionCleanupRef = React.useRef<(() => void) | null>(null);
  const dragCleanupRef = React.useRef<(() => void) | null>(null);
  const contextMenuCleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (preset !== "workspace" || !runtimeRef.current || !workspaceTree) {
      return;
    }

    runtimeRef.current.update({
      tree: workspaceTree,
      activePath: path ?? "",
      workerType,
    });
  }, [path, preset, workerType, workspaceTree]);

  React.useEffect(() => {
    const editorInstance = editorRef.current;
    actionCleanupRef.current?.();
    actionCleanupRef.current = null;

    if (!editorInstance || preset !== "workspace") return;

    actionCleanupRef.current = registerEditorActionGuard(
      editorInstance,
      actionGuardMode,
      actionGuardScope,
    );
  }, [actionGuardMode, actionGuardScope, preset]);

  React.useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "hidden") return;
      window.requestAnimationFrame(() => editorRef.current?.layout());
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, []);

  React.useEffect(
    () => () => {
      actionCleanupRef.current?.();
      dragCleanupRef.current?.();
      contextMenuCleanupRef.current?.();
      runtimeRef.current?.dispose();
    },
    [],
  );

  const handleMount: MonacoEditorMountHandler = (editorInstance, monaco) => {
    editorRef.current = editorInstance;

    if (preset === "workspace") {
      actionCleanupRef.current?.();
      actionCleanupRef.current = registerEditorActionGuard(
        editorInstance,
        actionGuardMode,
        actionGuardScope,
      );

      const editorDomNode = editorInstance.getDomNode();
      if (editorDomNode) {
        BLOCKED_EDITOR_DRAG_EVENTS.forEach((eventName) =>
          editorDomNode.addEventListener(eventName, blockEditorDragAction, true),
        );
        dragCleanupRef.current = () => {
          BLOCKED_EDITOR_DRAG_EVENTS.forEach((eventName) =>
            editorDomNode.removeEventListener(
              eventName,
              blockEditorDragAction,
              true,
            ),
          );
        };
      }

      const contextMenuDisposable = editorInstance.onContextMenu((event) => {
        event.event.preventDefault();
        event.event.stopPropagation();
      });
      contextMenuCleanupRef.current = () => contextMenuDisposable.dispose();

      if (workspaceTree) {
        runtimeRef.current = registerWorkspaceRuntime(monaco, {
          tree: workspaceTree,
          activePath: path ?? "",
          workerType,
        });
      }
    }

    editorInstance.onDidDispose(() => {
      actionCleanupRef.current?.();
      dragCleanupRef.current?.();
      contextMenuCleanupRef.current?.();
      runtimeRef.current?.dispose();
      editorRef.current = null;
      actionCleanupRef.current = null;
      dragCleanupRef.current = null;
      contextMenuCleanupRef.current = null;
      runtimeRef.current = null;
    });
  };

  return handleMount;
}
