"use client";

import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { EditorPanelHeader } from "@/components/editor/editor-panel-header";
import { FileCode2 } from "lucide-react";
import {
  EDITOR_ACTION_GUARD_MODE,
  type EditorActionGuardMode,
} from "@/constants/editor-action-guard";
import { useWorkspaceContext } from "../_providers/workspace-provider";

interface WorkspaceCodeEditorProps {
  onEditorChange: (value: string | undefined) => void;
  actionGuardMode?: EditorActionGuardMode;
  readOnly?: boolean;
  onDidType?: (text: string) => void;
  file: {
    name: string;
    path: string;
    language: string;
    value: string;
  } | null;
}

export default function WorkspaceCodeEditor({
  file,
  onEditorChange,
  actionGuardMode = EDITOR_ACTION_GUARD_MODE.ENFORCED,
  readOnly = false,
  onDidType,
}: WorkspaceCodeEditorProps) {
  const { clipboardScope, fileTreeData, workerType } = useWorkspaceContext();

  if (file === null || file.name.trim() === "") {
    return (
      <div className="flex h-full min-h-0 flex-col bg-editor-bg">
        <EditorPanelHeader>
          <FileCode2 aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs font-medium">Editor</span>
        </EditorPanelHeader>
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Selecione um arquivo para começar a editar.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-editor-bg">
      <EditorPanelHeader>
        <FileCode2 aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
        <span title={file.path} className="min-w-0 truncate font-mono text-xs font-medium">{file.name}</span>
      </EditorPanelHeader>

      <div className="min-h-0 min-w-0 flex-1">
        <MonacoCodeEditor
          preset="workspace"
          actionGuardMode={actionGuardMode}
          actionGuardScope={clipboardScope}
          path={file.path}
          workerType={workerType}
          workspaceTree={fileTreeData}
          value={file.value}
          onChange={onEditorChange}
          onDidType={onDidType}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
