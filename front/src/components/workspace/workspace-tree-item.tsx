import { FileNode, SelectedItem } from "@/types/shared";
import { ChevronRight, File, Folder } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface WorkspaceFileTreeProps {
  treeData: FileNode | null;
  onFileSelect: (node: FileNode) => void;
  selectedItem: SelectedItem;
  setSelectedItem: (item: SelectedItem) => void;
}

interface TreeNodeProps {
  node: FileNode;
  onFileSelect: (node: FileNode) => void;
  selectedPath: string;
  level?: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onFileSelect,
  selectedPath,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = React.useState(level === 0); // Raiz aberta por padrão
  const isSelected = node.path === selectedPath;

  const handleClick = () => {
    if (!node.isFile) {
      setIsOpen(!isOpen);
    }
    onFileSelect(node);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-700 transition-colors",
          isSelected && "bg-gray-700",
          !node.isFile && "font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {!node.isFile && (
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform text-gray-400",
              isOpen && "rotate-90"
            )}
          />
        )}
        {node.isFile ? (
          <File className="w-4 h-4 text-blue-400" />
        ) : (
          <Folder
            className={cn(
              "w-4 h-4",
              isOpen ? "text-yellow-400" : "text-gray-400"
            )}
          />
        )}
        <span className="text-sm text-gray-200 truncate">{node.id}</span>
      </div>

      {!node.isFile && isOpen && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              // Pastas primeiro, depois arquivos, ambos em ordem alfabética
              if (a.isFile === b.isFile) {
                return a.id.localeCompare(b.id);
              }
              return a.isFile ? 1 : -1;
            })
            .map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                onFileSelect={onFileSelect}
                selectedPath={selectedPath}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default function WorkspaceFileTree({
  treeData,
  onFileSelect,
  selectedItem,
}: WorkspaceFileTreeProps) {
  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <p className="text-sm">No files available</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <TreeNode
        node={treeData}
        onFileSelect={onFileSelect}
        selectedPath={selectedItem.path}
        level={0}
      />
    </div>
  );
}
