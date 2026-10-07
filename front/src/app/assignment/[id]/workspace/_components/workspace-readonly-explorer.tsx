"use client";

import { FileNode, SelectedItem } from "@/types/shared";
import React from "react";
import WorkspaceFileTree from "./workspace-tree-item";

interface WorkspaceReadonlyExplorerProps {
  treeData: FileNode;
  selectedItem: SelectedItem;
  onFileSelect: (node: FileNode) => void;
  onSelectItem: (item: SelectedItem) => void;
  onOpenInSecondary?: (node: FileNode) => void;
}

export default function WorkspaceReadonlyExplorer({
  treeData,
  selectedItem,
  onFileSelect,
  onSelectItem,
  onOpenInSecondary,
}: WorkspaceReadonlyExplorerProps) {
  return (
    <div className="w-full bg-card h-full min-h-0 flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Explorador
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto" data-eevee-workspace-drag-area="false">
        <WorkspaceFileTree
          treeData={treeData}
          onFileSelect={onFileSelect}
          onOpenInSecondary={onOpenInSecondary}
          selectedItem={selectedItem}
          onSelectItem={onSelectItem}
        />
      </div>
    </div>
  );
}