import { FileNode } from "@/types/shared";
import WorkspaceFileTree from "./workspace-tree-item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { FilePlusIcon, FolderPlusIcon, TrashIcon } from "lucide-react";
import { Input } from "../ui/input";
import React, { useState } from "react";
import { useWorkspaceContext } from "./workspace-provider";

interface WorkspaceExplorerProps {
  onFileSelect: (node: FileNode) => void;
  onTreeChange: (newTree: FileNode) => void;
  maxDepth?: number; // Nova prop para limite de profundidade
  maxFiles?: number; // Limite de arquivos totais
}

export default function WorkspaceExplorer({
  onFileSelect,
  onTreeChange,
  maxDepth = 5,
  maxFiles = 50,
}: WorkspaceExplorerProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"file" | "folder">("file");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTargetPath, setRenameTargetPath] = useState("");
  const [deleteTargetPath, setDeleteTargetPath] = useState("");
  const [draggedNodePath, setDraggedNodePath] = useState("");
  const [error, setError] = useState("");

  const {
    selectedItem,
    setSelectedItem,
    fileTreeData: treeData,
  } = useWorkspaceContext();

  const getPathDepth = (path: string): number => {
    if (!path) return 0;
    return path.split("/").filter(Boolean).length;
  };

  const countFiles = React.useCallback((node: FileNode): number => {
    if (node.isFile) return 1;

    let count = 0;
    if (node.children) {
      node.children.forEach((child) => {
        count += countFiles(child);
      });
    }
    return count;
  }, []);

  // Valida se pode criar novo item
  const canCreateItem = (
    targetPath: string,
    itemType: "file" | "folder",
  ): { valid: boolean; error?: string } => {
    // Verifica profundidade
    const newDepth = getPathDepth(targetPath) + 1;
    if (newDepth > maxDepth) {
      return {
        valid: false,
        error: `Maximum depth of ${maxDepth} levels reached. Cannot create items deeper.`,
      };
    }

    // Verifica total de arquivos (apenas se for arquivo)
    if (itemType === "file" && treeData) {
      const currentFileCount = countFiles(treeData);
      if (currentFileCount >= maxFiles) {
        return {
          valid: false,
          error: `Maximum of ${maxFiles} files reached. Delete some files first.`,
        };
      }
    }

    return { valid: true };
  };

  const getParentPath = (path: string) => {
    const parts = path.split("/");
    return parts.slice(0, -1).join("/") || "";
  };

  const getBaseName = (path: string) => {
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  };

  const findNodeByPath = (
    node: FileNode,
    targetPath: string,
  ): FileNode | null => {
    if (node.path === targetPath) {
      return node;
    }

    if (!node.children?.length) {
      return null;
    }

    for (const child of node.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) {
        return found;
      }
    }

    return null;
  };

  const updateNodePaths = (
    node: FileNode,
    oldPath: string,
    newPath: string,
  ): FileNode => {
    const updatedPath = node.path.startsWith(oldPath)
      ? `${newPath}${node.path.slice(oldPath.length)}`
      : node.path;

    return {
      ...node,
      path: updatedPath,
      children: node.children?.map((child) =>
        updateNodePaths(child, oldPath, newPath),
      ),
    };
  };

  const fileNameExistsInNode = (
    node: FileNode,
    targetPath: string,
    name: string,
  ): boolean => {
    if (node.path === targetPath) {
      if (node.children) {
        return node.children.some((child) => child.id === name);
      }
      return false;
    } else if (node.children) {
      for (const child of node.children) {
        const exists = fileNameExistsInNode(child, targetPath, name);
        if (exists) return true;
      }
    }
    return false;
  };

  const renameItemInTree = (
    node: FileNode,
    targetPath: string,
    newName: string,
  ): FileNode => {
    if (node.path === targetPath) {
      const parentPath = getParentPath(targetPath);
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;

      const renamedNode: FileNode = {
        ...node,
        id: newName,
        path: newPath,
      };

      if (renamedNode.children?.length) {
        renamedNode.children = renamedNode.children.map((child) =>
          updateNodePaths(child, targetPath, newPath),
        );
      }

      return renamedNode;
    }

    if (!node.children?.length) {
      return node;
    }

    const updatedChildren = node.children.map((child) =>
      renameItemInTree(child, targetPath, newName),
    );

    const hasChanges = updatedChildren.some(
      (child, index) => child !== node.children![index],
    );

    if (!hasChanges) {
      return node;
    }

    return {
      ...node,
      children: updatedChildren,
    };
  };

  const isFileNameValid = (name: string) => {
    if (!name || name.trim() === "") {
      setError("Name cannot be empty");
      return false;
    }
    if (/[<>:"/\\|?*\x00-\x1F]/.test(name)) {
      setError("Name contains invalid characters");
      return false;
    }

    setError("");
    return true;
  };

  const addItemToTree = (
    node: FileNode,
    targetPath: string,
    newItem: FileNode,
  ): FileNode => {
    if (node.isFile) return node;

    if (node.path === targetPath) {
      const updatedChildren = node.children
        ? [...node.children, newItem]
        : [newItem];

      return {
        ...node,
        children: updatedChildren,
      };
    } else if (node.children) {
      const updatedChildren = node.children.map((child) => {
        const updatedChild = addItemToTree(child, targetPath, newItem);
        return updatedChild || child;
      });

      const hasChanges = updatedChildren.some(
        (child, index) => child !== node.children![index],
      );

      if (hasChanges) {
        return {
          ...node,
          children: updatedChildren,
        };
      }
    }

    return node;
  };

  const removeItemFromTree = (node: FileNode, targetPath: string): FileNode => {
    if (!node.children || node.children.length === 0) return node;

    const updatedChildren = node.children
      .filter((child) => child.path !== targetPath)
      .map((child) => removeItemFromTree(child, targetPath));

    if (
      updatedChildren.length !== node.children.length ||
      updatedChildren.some((child, i) => child !== node.children![i])
    ) {
      return {
        ...node,
        children: updatedChildren.length > 0 ? updatedChildren : undefined,
      };
    }

    return node;
  };

  const extractNodeFromTree = (
    node: FileNode,
    sourcePath: string,
  ): { tree: FileNode; extracted: FileNode | null } => {
    if (!node.children?.length) {
      return { tree: node, extracted: null };
    }

    let extracted: FileNode | null = null;

    const updatedChildren = node.children
      .filter((child) => {
        if (child.path === sourcePath) {
          extracted = child;
          return false;
        }
        return true;
      })
      .map((child) => {
        const result = extractNodeFromTree(child, sourcePath);
        if (result.extracted) {
          extracted = result.extracted;
        }
        return result.tree;
      });

    const hasChanges =
      !!extracted ||
      updatedChildren.length !== node.children.length ||
      updatedChildren.some((child, index) => child !== node.children![index]);

    if (!hasChanges) {
      return { tree: node, extracted: null };
    }

    return {
      tree: {
        ...node,
        children: updatedChildren.length > 0 ? updatedChildren : undefined,
      },
      extracted,
    };
  };

  const insertItemInFolder = (
    node: FileNode,
    targetFolderPath: string,
    item: FileNode,
  ): FileNode => {
    if (node.isFile) {
      return node;
    }

    if (node.path === targetFolderPath) {
      const updatedChildren = node.children ? [...node.children, item] : [item];
      return {
        ...node,
        children: updatedChildren,
      };
    }

    if (!node.children?.length) {
      return node;
    }

    const updatedChildren = node.children.map((child) =>
      insertItemInFolder(child, targetFolderPath, item),
    );

    const hasChanges = updatedChildren.some(
      (child, index) => child !== node.children![index],
    );

    if (!hasChanges) {
      return node;
    }

    return {
      ...node,
      children: updatedChildren,
    };
  };

  const moveItemInTree = (
    tree: FileNode,
    sourcePath: string,
    targetFolderPath: string,
  ): { movedTree: FileNode; oldPath: string; newPath: string } | null => {
    if (sourcePath === targetFolderPath) return null;
    if (targetFolderPath.startsWith(`${sourcePath}/`)) return null;

    const { tree: treeWithoutSource, extracted } = extractNodeFromTree(
      tree,
      sourcePath,
    );
    if (!extracted) return null;

    if (
      fileNameExistsInNode(treeWithoutSource, targetFolderPath, extracted.id)
    ) {
      return null;
    }

    const oldPath = extracted.path;
    const newPath = targetFolderPath
      ? `${targetFolderPath}/${extracted.id}`
      : extracted.id;

    const movedNode = updateNodePaths(extracted, oldPath, newPath);
    const movedTree = insertItemInFolder(
      treeWithoutSource,
      targetFolderPath,
      movedNode,
    );

    return { movedTree, oldPath, newPath };
  };

  const handleCreateItem = () => {
    if (!isFileNameValid(newItemName)) return;

    let targetPath: string;
    if (selectedItem.type === "folder") {
      targetPath = selectedItem.path;
    } else {
      targetPath = getParentPath(selectedItem.path) || "";
    }

    if (fileNameExistsInNode(treeData!, targetPath, newItemName)) {
      setError("An item with this name already exists in the target location");
      return;
    }

    const validation = canCreateItem(targetPath, newItemType);
    if (!validation.valid) {
      setError(validation.error || "Cannot create item");
      return;
    }

    const newItemPath = targetPath
      ? `${targetPath}/${newItemName}`
      : newItemName;

    const newItem: FileNode = {
      id: newItemName,
      isSelectable: true,
      isFile: newItemType === "file",
      path: newItemPath,
    };

    if (newItemType === "folder") {
      newItem.children = [];
    }

    if (!treeData) {
      console.error("No tree data available");
      return;
    }

    const updatedTree = addItemToTree(treeData, targetPath, newItem);
    onTreeChange(updatedTree);

    setNewItemName("");
    setError("");
    setIsDialogOpen(false);
  };

  const handleDeleteItem = (node?: FileNode) => {
    if (!treeData) return;

    const targetNode = node ?? findNodeByPath(treeData, selectedItem.path);
    if (!targetNode) return;

    setSelectedItem({
      id: targetNode.id,
      type: targetNode.isFile ? "file" : "folder",
      path: targetNode.path,
    });
    setDeleteTargetPath(targetNode.path);
    setIsDeleteDialogOpen(true);
  };

  const handleRenameRequest = (node: FileNode) => {
    setSelectedItem({
      id: node.id,
      type: node.isFile ? "file" : "folder",
      path: node.path,
    });
    setRenameTargetPath(node.path);
    setRenameValue(node.id);
    setError("");
    setIsRenameDialogOpen(true);
  };

  const handleRename = () => {
    if (!treeData || !renameTargetPath) return;
    if (!isFileNameValid(renameValue)) return;

    const targetNode = findNodeByPath(treeData, renameTargetPath);
    if (!targetNode) return;

    const trimmedName = renameValue.trim();
    const parentPath = getParentPath(renameTargetPath);

    if (
      trimmedName !== targetNode.id &&
      fileNameExistsInNode(treeData, parentPath, trimmedName)
    ) {
      setError("An item with this name already exists in the target location");
      return;
    }

    const oldPath = targetNode.path;
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    const updatedTree = renameItemInTree(
      treeData,
      renameTargetPath,
      trimmedName,
    );

    onTreeChange(updatedTree);

    setSelectedItem((prev) => {
      if (prev.path === oldPath) {
        return {
          id: trimmedName,
          type: targetNode.isFile ? "file" : "folder",
          path: newPath,
        };
      }

      if (prev.path.startsWith(`${oldPath}/`)) {
        const updatedPath = `${newPath}${prev.path.slice(oldPath.length)}`;
        return {
          ...prev,
          id: getBaseName(updatedPath),
          path: updatedPath,
        };
      }

      return prev;
    });

    setRenameTargetPath("");
    setRenameValue("");
    setError("");
    setIsRenameDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!treeData || !deleteTargetPath) return;

    const updatedTree = removeItemFromTree(treeData, deleteTargetPath);
    onTreeChange(updatedTree);

    if (
      selectedItem.path === deleteTargetPath ||
      selectedItem.path.startsWith(`${deleteTargetPath}/`)
    ) {
      setSelectedItem({ id: "", type: "file", path: "" });
    }

    setDeleteTargetPath("");
    setIsDeleteDialogOpen(false);
  };

  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "move";
    setDraggedNodePath(node.path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    // visual feedback handled inside tree item component
  };

  const handleDrop = (e: React.DragEvent, targetNode: FileNode) => {
    e.preventDefault();

    if (!treeData) {
      setDraggedNodePath("");
      return;
    }

    const sourcePath = e.dataTransfer.getData("text/plain") || draggedNodePath;
    if (!sourcePath) {
      setDraggedNodePath("");
      return;
    }

    const targetFolderPath = targetNode.isFile
      ? getParentPath(targetNode.path)
      : targetNode.path;

    const moveResult = moveItemInTree(treeData, sourcePath, targetFolderPath);
    if (!moveResult) {
      setDraggedNodePath("");
      return;
    }

    const { movedTree, oldPath, newPath } = moveResult;
    onTreeChange(movedTree);

    setSelectedItem((prev) => {
      if (prev.path === oldPath) {
        return {
          ...prev,
          path: newPath,
          id: getBaseName(newPath),
        };
      }

      if (prev.path.startsWith(`${oldPath}/`)) {
        const updatedPath = `${newPath}${prev.path.slice(oldPath.length)}`;
        return {
          ...prev,
          path: updatedPath,
          id: getBaseName(updatedPath),
        };
      }

      return prev;
    });

    setDraggedNodePath("");
  };

  // Calcula informações da árvore para display
  const treeInfo = React.useMemo(() => {
    if (!treeData) return { fileCount: 0, maxDepthReached: 0 };

    const fileCount = countFiles(treeData);
    const maxDepthReached = getPathDepth(selectedItem.path);

    return { fileCount, maxDepthReached };
  }, [treeData, countFiles, selectedItem.path]);

  const hasSelection = Boolean(selectedItem.path);

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Explorador
          </h3>
        </div>

        {/* Info da árvore */}
        <div className="text-xs text-gray-500 mb-2 space-y-1">
          <div>
            Files: {treeInfo.fileCount}/{maxFiles}
          </div>
          <div>
            Current depth: {treeInfo.maxDepthReached}/{maxDepth}
          </div>
        </div>

        <div className="flex items-center gap-1 border-border">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => {
                  setNewItemType("file");
                  setError("");
                }}
                title={`Create file in ${
                  selectedItem.type === "folder"
                    ? selectedItem.id
                    : getParentPath(selectedItem.path) || "root"
                }`}
              >
                <FilePlusIcon className="w-4 h-4" />
              </Button>
            </DialogTrigger>

            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => {
                  setNewItemType("folder");
                  setError("");
                }}
                title={`Create folder in ${
                  selectedItem.type === "folder"
                    ? selectedItem.id
                    : getParentPath(selectedItem.path) || "root"
                }`}
              >
                <FolderPlusIcon className="w-4 h-4" />
              </Button>
            </DialogTrigger>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
              onClick={() => handleDeleteItem()}
              title={
                hasSelection
                  ? `Delete ${selectedItem.id || "selected item"}`
                  : "Select an item to delete"
              }
              disabled={!hasSelection}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>

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
                  {error && (
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setError("");
                      setNewItemName("");
                    }}
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
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Confirm Delete</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-white">
                    &quot;{selectedItem.id || getBaseName(deleteTargetPath)}
                    &quot;
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
                    onClick={() => setIsDeleteDialogOpen(false)}
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
              setIsRenameDialogOpen(open);
              if (!open) {
                setRenameTargetPath("");
                setRenameValue("");
                setError("");
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
                  {error && (
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRenameDialogOpen(false);
                      setRenameTargetPath("");
                      setRenameValue("");
                      setError("");
                    }}
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
      </div>

      <div className="flex-1 overflow-y-auto">
        <WorkspaceFileTree
          treeData={treeData}
          onFileSelect={onFileSelect}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          onRenameRequest={handleRenameRequest}
          onDeleteRequest={handleDeleteItem}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}
