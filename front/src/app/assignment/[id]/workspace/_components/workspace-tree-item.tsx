import { FileNode, SelectedItem } from "@/types/shared";
import { ChevronRight, File, Folder } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { WorkspaceTreeContextMenu } from "./workspace-tree-context-menu";

interface WorkspaceFileTreeProps {
  treeData: FileNode | null;
  onFileSelect: (node: FileNode) => void;
  onOpenInSecondary?: (node: FileNode) => void;
  selectedItem: SelectedItem;
  onSelectItem: (item: SelectedItem) => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  onRenameRequest?: (node: FileNode) => void;
  onDeleteRequest?: (node: FileNode) => void;
  onDragStart?: (e: React.DragEvent, node: FileNode) => void;
  onDragOver?: (e: React.DragEvent, node: FileNode) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, node: FileNode) => void;
}

interface TreeNodeProps {
  node: FileNode;
  onFileSelect: (node: FileNode) => void;
  onSelectItem: (item: SelectedItem) => void;
  selectedPath: string;
  level?: number;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  onDragStart?: (e: React.DragEvent, node: FileNode) => void;
  onDragOver?: (e: React.DragEvent, node: FileNode) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, node: FileNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onFileSelect,
  onSelectItem,
  selectedPath,
  level = 0,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [isOpen, setIsOpen] = React.useState(level === 0); // Raiz aberta por padrão
  const [isDragOver, setIsDragOver] = React.useState(false);
  const isSelected = node.path === selectedPath;

  const handleClick = () => {
    if (node.isFile) {
      onSelectItem({ id: node.id, type: "file", path: node.path });
      onFileSelect(node);
    } else {
      onSelectItem({ id: node.id, type: "folder", path: node.path });
      setIsOpen(!isOpen);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, node);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging the root node
    if (level === 0) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    onDragStart?.(e, node);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!node.isFile) {
      setIsDragOver(true);
    }
    onDragOver?.(e, node);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
    onDragLeave?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop?.(e, node);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-primary/20 transition-colors",
          isSelected && "bg-primary/20",
          !node.isFile && "font-medium",
          isDragOver &&
            !node.isFile &&
            "bg-primary/10 ring-1 ring-primary/50",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={level > 0}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!node.isFile && (
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform text-muted-foreground",
              isOpen && "rotate-90",
            )}
          />
        )}
        {node.isFile ? (
          <File className="w-4 h-4 text-primary" />
        ) : (
          <Folder
            className={cn(
              "w-4 h-4",
              isOpen ? "text-warning" : "text-muted-foreground",
            )}
          />
        )}
        <span className="text-sm text-foreground truncate">{node.id}</span>
      </div>

      {!node.isFile && isOpen && node.children && (
        <div>
          {[...node.children]
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
                onSelectItem={onSelectItem}
                selectedPath={selectedPath}
                level={level + 1}
                onContextMenu={onContextMenu}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
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
  onOpenInSecondary,
  selectedItem,
  onSelectItem,
  onContextMenu,
  onRenameRequest,
  onDeleteRequest,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: WorkspaceFileTreeProps) {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);
  const contextMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setContextMenu(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTreeContextMenu = (event: React.MouseEvent, node: FileNode) => {
    onContextMenu?.(event, node);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">Nenhum arquivo disponível</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <TreeNode
        node={treeData}
        onFileSelect={onFileSelect}
        onSelectItem={onSelectItem}
        selectedPath={selectedItem.path}
        level={0}
        onContextMenu={handleTreeContextMenu}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />

      {contextMenu && (
        <div ref={contextMenuRef}>
          <WorkspaceTreeContextMenu
            contextMenu={contextMenu}
            onOpenInSecondary={onOpenInSecondary}
            onRenameRequest={onRenameRequest}
            onDeleteRequest={onDeleteRequest}
            onClose={handleCloseContextMenu}
          />
        </div>
      )}
    </div>
  );
}
