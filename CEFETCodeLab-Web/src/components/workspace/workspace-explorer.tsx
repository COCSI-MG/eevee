import { FileTreeData } from "@/types/shared";
import WorkspaceFileTree from "./workspace-tree-item";

interface WorkspaceExplorerProps {
  treeData: FileTreeData[];
  onFileSelect: (file: string) => void;
}

export default function WorkspaceExplorer({
  treeData,
  onFileSelect
}: WorkspaceExplorerProps) {
  return (
    <div className="w-48 border-r border-border flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Explorador
        </h3>
      </div>

      <div className="flex-1 p-2">
        <WorkspaceFileTree
          treeData={treeData}
          onFileSelect={onFileSelect}
        />
      </div>
    </div>
  )
}