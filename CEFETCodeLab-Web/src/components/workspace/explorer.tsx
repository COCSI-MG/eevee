import React from "react";
import { FileType, NewItem } from "@/types/shared";
import { FileTree } from "./file-tree";

interface WorkspaceExplorerProps {
  explorerWidth: number;
  fileStructure: FileType[];
  activeFile: string;
  newItem: NewItem;
  openFile: (file: FileType) => void;
  setNewItem: React.Dispatch<React.SetStateAction<NewItem>>;
  setFileStructure: React.Dispatch<React.SetStateAction<FileType[]>>;
  cleanActiveFileAndContent: () => void;
  startResize: (
    element: "explorer" | "exercise" | "console",
    e: React.MouseEvent
  ) => void;
}

const WorkspaceExplorer: React.FC<WorkspaceExplorerProps> = ({
  explorerWidth,
  fileStructure,
  activeFile,
  newItem,
  openFile,
  setNewItem,
  setFileStructure,
  cleanActiveFileAndContent,
  startResize,
}) => {
  const findFirstFile = (items: FileType[]): FileType | null => {
    for (const item of items) {
      if (item.type === "file") {
        return item;
      }
      if (item.children) {
        const foundFile = findFirstFile(item.children);
        if (foundFile) {
          return foundFile;
        }
      }
    }
    return null;
  };

  const onActiveFileDeleted = () => {
    const firstAvailableFile = findFirstFile(fileStructure);
    if (firstAvailableFile) {
      openFile(firstAvailableFile);
      return;
    }
    cleanActiveFileAndContent();
  };

  const toggleFolderOpen = (items: FileType[], folderId: string) => {
    for (const item of items) {
      if (item.id === folderId && item.type === "folder") {
        item.isOpen = !item.isOpen;
        return true;
      }
      if (item.children) {
        if (toggleFolderOpen(item.children, folderId)) return true;
      }
    }
    return false;
  };

  const toggleFolder = (folderId: string) => {
    const updatedStructure = [...fileStructure];
    toggleFolderOpen(updatedStructure, folderId);
    setFileStructure(updatedStructure);
  };

  return (
    <>
      <div
        className="border-r border-slate-700 overflow-hidden flex flex-col"
        style={{ width: explorerWidth }}
      >
        <div className="p-2 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">EXPLORADOR</h3>
          </div>
        </div>
        <div className="flex-1">
          <FileTree
            fileStructure={fileStructure}
            activeFile={activeFile}
            newItem={newItem}
            openFile={openFile}
            toggleFolder={toggleFolder}
            setNewItem={setNewItem}
            setFileStructure={setFileStructure}
            onActiveFileDeleted={onActiveFileDeleted}
          />
        </div>
      </div>
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500"
        onMouseDown={(e) => startResize("explorer", e)}
      />
    </>
  );
};

export default WorkspaceExplorer;