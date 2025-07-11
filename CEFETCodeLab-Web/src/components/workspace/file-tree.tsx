import React from 'react';
import { FileType, NewItem } from '@/types/shared';
import { FileTreeItem } from './file-tree-item';

interface FileTreeProps {
  fileStructure: FileType[];
  activeFile: string;
  newItem: NewItem;
  openFile: (file: FileType) => void;
  toggleFolder: (folderId: string) => void;
  setNewItem: React.Dispatch<React.SetStateAction<NewItem>>;
  setFileStructure: React.Dispatch<React.SetStateAction<FileType[]>>;
  onActiveFileDeleted?: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  fileStructure,
  activeFile,
  newItem,
  openFile,
  toggleFolder,
  setNewItem,
  setFileStructure,
  onActiveFileDeleted,
}) => {
  return (
    <div className="file-tree">
      {fileStructure
        .sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        })
        .map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            level={0}
            activeFile={activeFile}
            newItem={newItem}
            openFile={openFile}
            toggleFolder={toggleFolder}
            setNewItem={setNewItem}
            setFileStructure={setFileStructure}
            fileStructure={fileStructure}
            onActiveFileDeleted={onActiveFileDeleted}
          />
        ))}
    </div>
  );
};
