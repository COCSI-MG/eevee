import React, { useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Delete,
  FileCode,
  FileText,
  FolderIcon,
  FolderOpen,
} from 'lucide-react';
import { FileType, NewItem } from '@/types/shared';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { getFilePath } from '@/lib/file-path-utils';

interface FileTreeItemProps {
  item: FileType;
  level: number;
  activeFile: string;
  newItem: NewItem;
  openFile: (file: FileType) => void;
  toggleFolder: (folderId: string) => void;
  setNewItem: React.Dispatch<React.SetStateAction<NewItem>>;
  setFileStructure: React.Dispatch<React.SetStateAction<FileType[]>>;
  fileStructure: FileType[];
  getFileIcon: (filename: string) => React.ReactNode;
  onActiveFileDeleted?: () => void;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  level,
  activeFile,
  newItem,
  openFile,
  toggleFolder,
  setNewItem,
  setFileStructure,
  fileStructure,
  getFileIcon,
  onActiveFileDeleted,
}) => {
  const newItemRef = useRef<HTMLInputElement>(null);

  const deleteItem = (itemToDelete: FileType) => {
    if (
      window.confirm(
        `Deseja realmente excluir ${
          itemToDelete.type === 'folder' ? 'a pasta' : 'o arquivo'
        } "${itemToDelete.name}"?`
      )
    ) {
      const findParentAndDelete = (structure: FileType[]): FileType[] => {
        return structure.map((node) => {
          if (node.children && node.children.length > 0) {
            const childIndex = node.children.findIndex(
              (child) => child.id === itemToDelete.id
            );

            if (childIndex !== -1) {
              const updatedChildren = [...node.children];
              updatedChildren.splice(childIndex, 1);
              return {
                ...node,
                children: updatedChildren,
              };
            } else {
              return {
                ...node,
                children: findParentAndDelete(node.children),
              };
            }
          }
          return node;
        });
      };

      const updatedStructure = findParentAndDelete(fileStructure);

      const wasActiveFile =
        itemToDelete.type === 'file' &&
        getFilePath(itemToDelete, fileStructure) === activeFile;

      setFileStructure(updatedStructure);

      toast({
        title: `${
          itemToDelete.type === 'folder' ? 'Pasta' : 'Arquivo'
        } excluído`,
        description: `${
          itemToDelete.type === 'folder' ? 'A pasta' : 'O arquivo'
        } "${itemToDelete.name}" foi removido.`,
        variant: 'default',
      });

      if (wasActiveFile && onActiveFileDeleted) {
        onActiveFileDeleted();
      }
    }
  };

  const renderChildren = (children: FileType[]) => {
    return children
      .sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      })
      .map((child) => (
        <FileTreeItem
          key={child.id}
          item={child}
          level={level + 1}
          activeFile={activeFile}
          newItem={newItem}
          openFile={openFile}
          toggleFolder={toggleFolder}
          setNewItem={setNewItem}
          setFileStructure={setFileStructure}
          fileStructure={fileStructure}
          getFileIcon={getFileIcon}
          onActiveFileDeleted={onActiveFileDeleted}
        />
      ));
  };

  return (
    <div className="relative">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-1 text-sm py-1 px-1 rounded cursor-pointer group ${
              item.type === 'file' &&
              getFilePath(item, fileStructure) === activeFile
                ? 'bg-slate-700'
                : 'hover:bg-slate-800'
            }`}
            style={{ paddingLeft: `${level * 12 + 4}px` }}
            onClick={() => {
              if (item.type === 'file') {
                openFile(item);
              } else if (item.type === 'folder') {
                if (newItem.isCreating) {
                  setNewItem({
                    ...newItem,
                    isCreating: false,
                    name: '',
                  });
                }
                toggleFolder(item.id);
              }
            }}
          >
            {item.type === 'folder' && (
              <div className="flex-shrink-0">
                {item.isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}

            {item.type === 'folder' ? (
              item.isOpen ? (
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-300" />
              ) : (
                <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-300" />
              )
            ) : (
              getFileIcon(item.name)
            )}

            <span className="truncate flex-grow">{item.name}</span>
          </div>

          {newItem.isCreating &&
            newItem.parentId === item.id &&
            item.type === 'folder' && (
              <div className="ml-2">
                <div
                  className="flex items-center gap-1 pl-2 mt-1"
                  style={{ paddingLeft: `${(level + 1) * 12}px` }}
                >
                  {newItem.type === 'folder' ? (
                    <FolderIcon className="h-4 w-4 flex-shrink-0 text-blue-300" />
                  ) : (
                    <FileText className="h-4 w-4 flex-shrink-0 text-blue-300" />
                  )}
                  <div className="flex items-center flex-grow">
                    <Input
                      ref={newItemRef}
                      value={newItem.name}
                      onChange={(e) => {
                        if (
                          item.children
                            ?.map((child: FileType) => child.name)
                            .includes(e.target.value)
                        ) {
                          toast({
                            title: 'Nome do arquivo já existe',
                            description: 'Escolha um nome diferente.',
                            variant: 'destructive',
                          });
                          return;
                        }

                        setNewItem({
                          ...newItem,
                          name: e.target.value,
                        });
                      }}
                      className="h-6 py-0 text-sm bg-slate-800 border-slate-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const updatedStructure = [...fileStructure];
                          const newId = `new-${Date.now()}`;
                          const newItemData: FileType = {
                            id: newId,
                            name: newItem.name,
                            type: newItem.type,
                            lastModified: new Date(),
                            parentId:
                              typeof item.id === 'undefined'
                                ? undefined
                                : item.id,
                            isOpen: false,
                            children: [],
                          };
                          item.children?.push(newItemData);
                          setFileStructure(updatedStructure);
                          setNewItem({
                            ...newItem,
                            isCreating: false,
                            name: '',
                          });
                        } else {
                          if (e.key === 'Escape') {
                            setNewItem({
                              ...newItem,
                              isCreating: false,
                              name: '',
                            });
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          {item.type === 'folder' && item.children && item.isOpen && (
            <div className="ml-2">{renderChildren(item.children)}</div>
          )}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          {item.type === 'folder' && (
            <>
              <ContextMenuItem
                onClick={() => {
                  setNewItem({
                    name: '',
                    parentId: item.id,
                    type: 'file',
                    isCreating: true,
                  });
                }}
              >
                <FileCode className="h-4 w-4 mr-2" />
                <span>Criar arquivo</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setNewItem({
                    name: '',
                    parentId: item.id,
                    type: 'folder',
                    isCreating: true,
                  });
                }}
              >
                <FolderIcon className="h-4 w-4 mr-2" />
                <span>Criar pasta</span>
              </ContextMenuItem>
            </>
          )}
          {/* Evitar excluir pastas de nível superior sem ID de pai */}
          {item.parentId !== undefined && (
            <ContextMenuItem
              onClick={() => {
                deleteItem(item);
              }}
              className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
            >
              <Delete className="h-4 w-4 mr-2" />
              <span>Remover</span>
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
