"use client";

import React from "react";
import { FileNode } from "@/types/shared";
import { FilePlusIcon, FolderPlusIcon, TrashIcon } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { useWorkspaceExplorer } from "../_hooks/use-workspace-explorer";
import { WorkspaceExplorerContextMenu } from "./workspace-explorer-context-menu";
import WorkspaceFileTree from "./workspace-tree-item";

interface WorkspaceExplorerProps {
  onFileSelect: (node: FileNode) => void;
  onTreeChange: (newTree: FileNode) => void | Promise<void>;
  onOpenInSecondary?: (node: FileNode) => void;
  maxDepth?: number;
  maxFiles?: number;
  readOnly?: boolean;
}

export default function WorkspaceExplorer({
  onFileSelect,
  onTreeChange,
  onOpenInSecondary,
  maxDepth = 5,
  maxFiles = 50,
  readOnly = false,
}: WorkspaceExplorerProps) {
  const {
    selectedItem,
    treeData,
    treeInfo,
    hasSelection,
    createTargetLabel,
    deleteTargetLabel,
    selectItem,
    newItemName,
    setNewItemName,
    newItemType,
    isCreateDialogOpen,
    isDeleteDialogOpen,
    isRenameDialogOpen,
    renameValue,
    setRenameValue,
    error,
    setError,
    openCreateItemDialog,
    closeCreateDialog,
    resetCreateDialog,
    closeDeleteDialog,
    closeRenameDialog,
    handleCreateItem,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleRenameRequest,
    handleRename,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useWorkspaceExplorer({
    onTreeChange,
    maxDepth,
    maxFiles,
  });

  const [backgroundContextMenu, setBackgroundContextMenu] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleBackgroundContextMenu = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setBackgroundContextMenu({
        x: event.clientX,
        y: event.clientY,
      });
    },
    [],
  );

  React.useEffect(() => {
    const handleClose = () => setBackgroundContextMenu(null);

    document.addEventListener("click", handleClose);
    document.addEventListener("keydown", handleClose);
    document.addEventListener("contextmenu", handleClose, true);

    return () => {
      document.removeEventListener("click", handleClose);
      document.removeEventListener("keydown", handleClose);
      document.removeEventListener("contextmenu", handleClose, true);
    };
  }, []);

  return (
    <div className="w-full bg-card h-full min-h-0 flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Explorador
          </h3>
        </div>

        <div className="text-xs text-muted-foreground mb-2 space-y-1">
          <div>
            Arquivos: {treeInfo.fileCount}/{maxFiles}
          </div>
          <div>
            Profundidade atual: {treeInfo.maxDepthReached}/{maxDepth}
          </div>
        </div>

        {!readOnly && <div className="flex items-center gap-1 border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/20"
            onClick={() => openCreateItemDialog("file")}
            title={`Criar arquivo em ${createTargetLabel}`}
          >
            <FilePlusIcon className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/20"
            onClick={() => openCreateItemDialog("folder")}
            title={`Criar pasta em ${createTargetLabel}`}
          >
            <FolderPlusIcon className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-primary/20"
            onClick={() => handleDeleteRequest()}
            title={
              hasSelection
                ? `Excluir ${selectedItem.id || "item selecionado"}`
                : "Selecione um item para excluir"
            }
            disabled={!hasSelection}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>}

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeCreateDialog();
            }
          }}
        >
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Criar Novo {newItemType === "file" ? "Arquivo" : "Pasta"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Nome do {newItemType === "file" ? "Arquivo" : "Pasta"}
                </Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => {
                    setNewItemName(e.target.value);
                    setError("");
                  }}
                  placeholder={
                    newItemType === "file" ? "example.js" : "folder-name"
                  }
                  className="bg-primary/20 border-border text-foreground mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
                />
                {error && <p className="text-destructive text-sm mt-1">{error}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetCreateDialog}
                  className="border-border text-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateItem}
                  className="bg-primary hover:bg-primary/90"
                >
                  Criar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeDeleteDialog();
            }
          }}
        >
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-foreground">
                Tem certeza que deseja excluir{" "}
                <span className="font-semibold text-foreground">
                  &quot;{selectedItem.id || deleteTargetLabel}&quot;
                </span>
                ?
                {selectedItem.type === "folder" && (
                  <span className="block text-sm text-destructive mt-1">
                    Isso também excluirá todos os arquivos e pastas dentro dela.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeDeleteDialog}
                  className="border-border text-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isRenameDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeRenameDialog();
            }
          }}
        >
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Renomear Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rename-name" className="text-foreground">
                  Novo nome
                </Label>
                <Input
                  id="rename-name"
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    setError("");
                  }}
                  className="bg-primary/20 border-border text-foreground mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
                {error && <p className="text-destructive text-sm mt-1">{error}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeRenameDialog}
                  className="border-border text-foreground hover:text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRename}
                  className="bg-primary hover:bg-primary/90"
                >
                  Renomear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        onContextMenu={handleBackgroundContextMenu}
      >
        <WorkspaceFileTree
          treeData={treeData}
          onFileSelect={onFileSelect}
          onOpenInSecondary={onOpenInSecondary}
          selectedItem={selectedItem}
          onSelectItem={selectItem}
           onRenameRequest={readOnly ? undefined : handleRenameRequest}
           onDeleteRequest={readOnly ? undefined : handleDeleteRequest}
           onDragStart={readOnly ? undefined : handleDragStart}
           onDragOver={readOnly ? undefined : handleDragOver}
           onDragLeave={readOnly ? undefined : handleDragLeave}
           onDrop={readOnly ? undefined : handleDrop}
        />

        {backgroundContextMenu && !readOnly && (
          <WorkspaceExplorerContextMenu
            position={backgroundContextMenu}
            onCreateFile={() => openCreateItemDialog("file")}
            onCreateFolder={() => openCreateItemDialog("folder")}
            onClose={() => setBackgroundContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
