"use client";

import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { EditorActionGuardMode } from "@/hooks/user-actions/editor-action-guard";
import { useWorkspaceContext } from "../_providers/workspace-provider";

interface WorkspaceCodeEditorProps {
  onEditorChange: (value: string | undefined) => void;
  actionGuardMode?: EditorActionGuardMode;
  readOnly?: boolean;
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
  actionGuardMode = "enforced",
  readOnly = false,
}: WorkspaceCodeEditorProps) {
  const { clipboardScope, fileTreeData, workerType } = useWorkspaceContext();

  if (file === null || file.name.trim() === "") {
    return (
      <div className="flex items-center justify-center h-full min-h-0 text-muted-foreground">
        Selecione um arquivo para começar a editar.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="bg-editor-header border-b border-border">
        <div className="flex">
          <div className="flex items-center px-4 py-2 bg-editor-bg border-r border-border">
            <span className="text-sm">{file.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({file.language || "plaintext"})
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <MonacoCodeEditor
          preset="workspace"
          actionGuardMode={actionGuardMode}
          actionGuardScope={clipboardScope}
          path={file.path}
          workerType={workerType}
          workspaceTree={fileTreeData}
          value={file.value}
          onChange={onEditorChange}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
