"use client";

import { FileNode } from "@/types/shared";
import React from "react";

interface WorkspaceTreeContextMenuProps {
  contextMenu: {
    x: number;
    y: number;
    node: FileNode;
  };
  onOpenInSecondary?: (node: FileNode) => void;
  onRenameRequest?: (node: FileNode) => void;
  onDeleteRequest?: (node: FileNode) => void;
  onClose: () => void;
}

export function WorkspaceTreeContextMenu({
  contextMenu,
  onOpenInSecondary,
  onRenameRequest,
  onDeleteRequest,
  onClose,
}: WorkspaceTreeContextMenuProps) {
  return (
    <div
      className="fixed z-50 min-w-[120px] rounded-md border border-border bg-card py-1 shadow-lg"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {contextMenu.node.isFile && onOpenInSecondary && (
        <button
          type="button"
          className="block w-full px-3 py-1.5 text-left text-sm text-primary hover:bg-primary/20"
          onClick={() => {
            onOpenInSecondary(contextMenu.node);
            onClose();
          }}
        >
          Mostrar lado a lado
        </button>
      )}
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-primary/20"
        onClick={() => {
          onRenameRequest?.(contextMenu.node);
          onClose();
        }}
      >
        Renomear
      </button>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-primary/20"
        onClick={() => {
          onDeleteRequest?.(contextMenu.node);
          onClose();
        }}
      >
        Excluir
      </button>
    </div>
  );
}
