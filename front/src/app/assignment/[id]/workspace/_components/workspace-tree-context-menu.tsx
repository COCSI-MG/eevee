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
      className="fixed z-50 min-w-[120px] rounded-md border border-gray-700 bg-gray-800 py-1 shadow-lg"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {contextMenu.node.isFile && onOpenInSecondary && (
        <button
          type="button"
          className="block w-full px-3 py-1.5 text-left text-sm text-blue-300 hover:bg-gray-700"
          onClick={() => {
            onOpenInSecondary(contextMenu.node);
            onClose();
          }}
        >
          Show in side-by-side view
        </button>
      )}
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700"
        onClick={() => {
          onRenameRequest?.(contextMenu.node);
          onClose();
        }}
      >
        Rename
      </button>
      <button
        type="button"
        className="block w-full px-3 py-1.5 text-left text-sm text-red-300 hover:bg-gray-700"
        onClick={() => {
          onDeleteRequest?.(contextMenu.node);
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}
