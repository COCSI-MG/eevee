"use client";

import { Button } from "@/components/ui/button";
import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import WorkspaceCodeEditor from "./workspace-code-editor";
import { useWorskpaceResizing } from "@/hooks/use-workspace-resizing";

interface WorkspaceShellProps {
  explorer: React.ReactNode;
  activeFile: Parameters<typeof WorkspaceCodeEditor>[0]["file"];
  secondaryFile: Parameters<typeof WorkspaceCodeEditor>[0]["file"];
  onEditorChange: (value: string | undefined) => void;
  onSecondaryEditorChange: (value: string | undefined) => void;
  editorActionGuardMode: Parameters<typeof WorkspaceCodeEditor>[0]["actionGuardMode"];
  editorReadOnly?: boolean;
  onItemMoved?: (oldPath: string, newPath: string) => void;
  fileTreeData?: FileNode;
  selectedItem?: SelectedItem;
}

export default function WorkspaceShell({
  explorer,
  activeFile,
  secondaryFile,
  onEditorChange,
  onSecondaryEditorChange,
  editorActionGuardMode,
  editorReadOnly = false
}: WorkspaceShellProps) {

  const { explorerWidth, startResize } = useWorskpaceResizing();
  const [isSplitView, setIsSplitView] = React.useState(false);

  React.useEffect(() => {
    if (secondaryFile) setIsSplitView(true);
  }, [secondaryFile]);

  const commonEditorProps = {
    "actionGuardMode": editorActionGuardMode,
    "readOnly": editorReadOnly
  }

  const primaryEditorProps = {
    ...commonEditorProps,
    file: activeFile,
    onEditorChange
  }


  return (
    <div className="flex flex-1 min-h-0">
      <div
        className="relative flex shrink-0 min-w-[150px] max-w-[400px] flex-col bg-card border-r border-border h-full min-h-0"
        style={{ width: explorerWidth }}
      >
        {explorer}

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

          {isSplitView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSplitView(false)}
              disabled={!secondaryFile}
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

        <div
          className={`flex-1 min-h-0
            ${
              isSplitView ? "grid grid-cols-2 divide-x divide-border" : ""
            }`
          }
        >
          <WorkspaceCodeEditor {...primaryEditorProps} />

          {isSplitView && secondaryFile && (
            <WorkspaceCodeEditor
              file={secondaryFile}
              onEditorChange={onSecondaryEditorChange}
              {...commonEditorProps}
            />
          )}

        </div>
      </div>
    </div>
  );
}
