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
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, node: FileNode) => boolean;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, node: FileNode) => boolean;
  draggedNodePath?: string;
}

interface TreeNodeProps {
  node: FileNode;
  onFileSelect: (node: FileNode) => void;
  onSelectItem: (item: SelectedItem) => void;
  selectedPath: string;
  level?: number;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  onDragStart?: (e: React.DragEvent, node: FileNode) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent, node: FileNode) => boolean;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, node: FileNode) => boolean;
  draggedNodePath?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onFileSelect,
  onSelectItem,
  selectedPath,
  level = 0,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedNodePath,
}) => {
  const [isOpen, setIsOpen] = React.useState(level === 0); // Raiz aberta por padrão
  const [dropState, setDropState] = React.useState<"valid" | "invalid" | null>(null);

  const isSelected = node.path === selectedPath;
  const isDragging = node.path === draggedNodePath;
  const isDraggable = level > 0 && Boolean(onDragStart);

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
    const isValid = onDragOver?.(e, node) ?? false;
    setDropState(isValid ? "valid" : "invalid");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropState(null);
    onDragLeave?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropState(null);
    const didMove = onDrop?.(e, node) ?? false;
    if (didMove && !node.isFile) {
      setIsOpen(true);
    }
  };

  const interactiveProps = {
    ...(isDraggable
      ? {
          onDragStart: handleDragStart,
          onDragEnd,
        }
      : {}),
    ...(onDragOver
      ? {
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
        }
      : {}),
    ...(onDrop
      ? {
          onDrop: handleDrop,
        }
      : {}),
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-primary/20 transition-colors",
          isSelected && "bg-primary/20",
          !node.isFile && "font-medium",
          isDraggable && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50",
          dropState === "valid" &&
            "bg-info/20 ring-1 ring-inset ring-info/50",
          dropState === "invalid" &&
            "cursor-not-allowed bg-destructive/20 ring-1 ring-inset ring-destructive/40",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={isDraggable}
        aria-grabbed={isDragging}
        {...interactiveProps}
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
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                draggedNodePath={draggedNodePath}
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
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedNodePath,
}: WorkspaceFileTreeProps) {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    node: FileNode;
  } | null>(null);
  const [backgroundDropState, setBackgroundDropState] = React.useState<"valid" | "invalid" | null>(null);
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

  const handleBackgroundDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !onDragOver) return

    const isValid = onDragOver(event, treeData!);
    setBackgroundDropState(isValid ? "valid" : "invalid");
  };

  const handleBackgroundDragLeave = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) return

    setBackgroundDropState(null);
    onDragLeave?.(event);
  };

  const handleBackgroundDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !onDrop) return

    setBackgroundDropState(null);
    onDrop(event, treeData!);
  };

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">Nenhum arquivo disponível</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-full py-2 transition-colors",
        backgroundDropState === "valid" && "bg-info/10",
        backgroundDropState === "invalid" && "bg-destructive/10",
      )}
      onDragOver={onDragOver ? handleBackgroundDragOver : undefined}
      onDragLeave={onDragOver ? handleBackgroundDragLeave : undefined}
      onDrop={onDrop ? handleBackgroundDrop : undefined}
    >
      <TreeNode
        node={treeData}
        onFileSelect={onFileSelect}
        onSelectItem={onSelectItem}
        selectedPath={selectedItem.path}
        level={0}
        onContextMenu={handleTreeContextMenu}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        draggedNodePath={draggedNodePath}
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
