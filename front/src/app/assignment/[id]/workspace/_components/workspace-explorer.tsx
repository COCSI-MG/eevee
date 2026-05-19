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
}

export default function WorkspaceExplorer({
  onFileSelect,
  onTreeChange,
  onOpenInSecondary,
  maxDepth = 5,
  maxFiles = 50,
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

    return () => {
      document.removeEventListener("click", handleClose);
      document.removeEventListener("keydown", handleClose);
    };
  }, []);

  return (
    <div className="w-full bg-gray-800 h-full min-h-0 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Explorador
          </h3>
        </div>

        <div className="text-xs text-gray-500 mb-2 space-y-1">
          <div>
            Files: {treeInfo.fileCount}/{maxFiles}
          </div>
          <div>
            Current depth: {treeInfo.maxDepthReached}/{maxDepth}
          </div>
        </div>

        <div className="flex items-center gap-1 border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={() => openCreateItemDialog("file")}
            title={`Create file in ${createTargetLabel}`}
          >
            <FilePlusIcon className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={() => openCreateItemDialog("folder")}
            title={`Create folder in ${createTargetLabel}`}
          >
            <FolderPlusIcon className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
            onClick={() => handleDeleteRequest()}
            title={
              hasSelection
                ? `Delete ${selectedItem.id || "selected item"}`
                : "Select an item to delete"
            }
            disabled={!hasSelection}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeCreateDialog();
            }
          }}
        >
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                Create New {newItemType === "file" ? "File" : "Folder"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  {newItemType === "file" ? "File" : "Folder"} Name
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
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
                />
                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={resetCreateDialog}
                  className="border-gray-600 text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateItem}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create
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
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white">
                  &quot;{selectedItem.id || deleteTargetLabel}&quot;
                </span>
                ?
                {selectedItem.type === "folder" && (
                  <span className="block text-sm text-red-400 mt-1">
                    This will also delete all files and folders inside it.
                  </span>
                )}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeDeleteDialog}
                  className="border-gray-600 text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
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
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Rename Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rename-name" className="text-gray-300">
                  New name
                </Label>
                <Input
                  id="rename-name"
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    setError("");
                  }}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeRenameDialog}
                  className="border-gray-600 text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRename}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Rename
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto" onContextMenu={handleBackgroundContextMenu}>
        <WorkspaceFileTree
          treeData={treeData}
          onFileSelect={onFileSelect}
          onOpenInSecondary={onOpenInSecondary}
          selectedItem={selectedItem}
          onSelectItem={selectItem}
          onRenameRequest={handleRenameRequest}
          onDeleteRequest={handleDeleteRequest}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />

        {backgroundContextMenu && (
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
