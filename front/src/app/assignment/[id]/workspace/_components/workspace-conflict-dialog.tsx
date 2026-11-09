"use client";

import { useRef, useState } from "react";
import { MonacoCodeDiff } from "@/components/editor/monaco-code-editor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { EditorActionGuardMode } from "@/constants/editor-action-guard";
import { cn } from "@/lib/utils";
import type { WorkspaceVersionConflict } from "../_hooks/use-workspace-initialization";

interface WorkspaceConflictDialogProps extends WorkspaceVersionConflict {
  actionGuardMode: EditorActionGuardMode;
}

export default function WorkspaceConflictDialog({
  files,
  choose,
  actionGuardMode,
}: WorkspaceConflictDialogProps) {
  const [selectedPath, setSelectedPath] = useState(files[0].path);
  const firstFileButton = useRef<HTMLButtonElement>(null);
  const selectedFile = files.find((file) => file.path === selectedPath) ?? files[0];

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) choose("cancel");
      }}
    >
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto rounded-lg p-4 sm:p-6"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          firstFileButton.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Versões diferentes do código</AlertDialogTitle>
          <AlertDialogDescription>
            Compare os arquivos antes de escolher. Enviar a versão do navegador
            substitui a versão mostrada do servidor. Usar a versão do servidor
            substitui os arquivos deste navegador pela cópia salva no servidor.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid min-w-0 overflow-hidden rounded-md border border-border/50 md:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="min-w-0 border-b border-border/50 bg-card md:border-b-0 md:border-r">
            <h3 className="px-3 pt-3 text-xs font-semibold">
              Arquivos diferentes ({files.length})
            </h3>
            <ul className="max-h-32 space-y-1 overflow-y-auto p-2 md:max-h-[50vh]">
              {files.map((file) => (
                <li key={file.path}>
                  <button
                    ref={file.path === files[0].path ? firstFileButton : undefined}
                    type="button"
                    aria-pressed={file.path === selectedFile.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={cn(
                      "w-full rounded-md border border-transparent px-2 py-1.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      file.path === selectedFile.path
                        ? "border-border/50 bg-background"
                        : "hover:bg-background/50",
                    )}
                  >
                    <span className="block break-all font-mono text-xs">{file.path}</span>
                    <span className="block text-xs text-muted-foreground">
                      {file.browserContent === undefined
                        ? "Só no servidor"
                        : file.serverContent === undefined
                          ? "Só no navegador"
                          : "Modificado"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-border/50 px-3 py-2 text-xs font-medium">
              <span className="text-destructive">− Navegador</span>
              <span className="text-success">+ Servidor</span>
            </div>
            <MonacoCodeDiff
              key={selectedFile.path}
              path={selectedFile.path}
              height="min(45vh, 24rem)"
              original={selectedFile.browserContent ?? ""}
              modified={selectedFile.serverContent ?? ""}
              originalLabel="Versão do navegador"
              modifiedLabel="Versão do servidor"
              actionGuardMode={actionGuardMode}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button type="button" onClick={() => choose("browser")}>
            Enviar versão do navegador
          </Button>
          <Button type="button" variant="destructive" onClick={() => choose("server")}>
            Usar versão do servidor
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
