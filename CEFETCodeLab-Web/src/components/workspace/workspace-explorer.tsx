import { FileNode } from '@/types/shared';
import WorkspaceFileTree from './workspace-tree-item';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { FilePlusIcon, FolderPlusIcon, TrashIcon } from 'lucide-react';
import { Input } from '../ui/input';
import React, { useState } from 'react';
import { useWorkspaceContext } from './worskpace-provider';

interface WorkspaceExplorerProps {
  onFileSelect: (node: FileNode) => void;
}

export default function WorkspaceExplorer({
  onFileSelect,
}: WorkspaceExplorerProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    selectedItem,
    setSelectedItem,
    fileTreeData: treeData,
    setFileTreeData: setFileTree,
  } = useWorkspaceContext();

  const getParentPath = (path: string) => {
    const parts = path.split('/');
    return parts.slice(0, -1).join('/') || '';
  };

  // const findItemInTree = (
  //   nodes: FileNode[],
  //   target: string
  // ): FileNode | null => {
  //   for (const node of nodes) {
  //     if (node.path === target) {
  //       return node;
  //     }
  //     if (node.children) {
  //       const found = findItemInTree(node.children, target);
  //       if (found) return found;
  //     }
  //   }
  //   return null;
  // };

  const addItemToTree = (
    nodes: FileNode[],
    targetPath: string,
    newItem: FileNode
  ): FileNode[] => {
    return nodes.map((node) => {
      if (node.path === targetPath && !node.isFile) {
        const children = node.children
          ? [...node.children, newItem]
          : [newItem];
        return { ...node, children };
      }
      if (node.children) {
        return {
          ...node,
          children: addItemToTree(node.children, targetPath, newItem),
        };
      }
      return node;
    });
  };

  const removeItemFromTree = (
    nodes: FileNode[],
    targetPath: string
  ): FileNode[] => {
    return nodes.filter((node) => {
      if (node.path === targetPath) {
        return false; // Remove this node
      }
      if (node.children) {
        node.children = removeItemFromTree(node.children, targetPath);
      }
      return true;
    });
  };

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;

    let targetPath: string;
    if (selectedItem.type === 'folder') {
      targetPath = selectedItem.path;
    } else {
      targetPath = getParentPath(selectedItem.path) || '';
    }

    const newItemPath = targetPath
      ? `${targetPath}/${newItemName}`
      : newItemName;

    const newItem: FileNode = {
      id: Date.now().toString(),
      label: newItemName,
      isSelectable: true, //set to true to allow selection
      isFile: newItemType === 'file',
      path: newItemPath,
    };

    if (newItemType === 'folder') {
      newItem.children = [];
    }

    if (targetPath) {
      setFileTree((prevTree) => addItemToTree(prevTree, targetPath, newItem));
    } else {
      setFileTree((prevTree) => [...prevTree, newItem]);
    }

    setNewItemName('');
    setIsDialogOpen(false);
  };

  const handleDeleteItem = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedItem) return;
    setFileTree((prevTree) => removeItemFromTree(prevTree, selectedItem.path));
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Explorador
          </h3>
        </div>

        <div className="flex items-center gap-1 border-border">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => setNewItemType('file')}
                title={`Create file in ${selectedItem.type === 'folder'
                    ? selectedItem.name
                    : getParentPath(selectedItem.path) || 'root'
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
                onClick={() => setNewItemType('folder')}
                title={`Create folder in ${selectedItem.type === 'folder'
                    ? selectedItem.name
                    : getParentPath(selectedItem.path) || 'root'
                  }`}
              >
                <FolderPlusIcon className="w-4 h-4" />
              </Button>
            </DialogTrigger>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
              onClick={handleDeleteItem}
              title={`Delete ${selectedItem.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>

            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Create New {newItemType === 'file' ? 'File' : 'Folder'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">
                    {newItemType === 'file' ? 'File' : 'Folder'} Name
                  </Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={
                      newItemType === 'file' ? 'example.js' : 'folder-name'
                    }
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
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
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-white">
                    &quot;{selectedItem.name}&quot;
                  </span>
                  ?
                  {selectedItem.type === 'folder' && (
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <WorkspaceFileTree
          treeData={treeData}
          onFileSelect={onFileSelect}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      </div>
    </div>
  );
}
