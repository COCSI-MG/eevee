import { FileNode, SelectedItem } from '@/types/shared';
import { File, Folder, Tree } from '../magicui/file-tree';

interface WorkspaceFileTreeProps {
  treeData: FileNode[];
  onFileSelect: (node: FileNode) => void;
  selectedItem: SelectedItem;
  setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem>>;
}

export default function WorkspaceFileTree({
  treeData,
  onFileSelect,
  selectedItem,
}: WorkspaceFileTreeProps) {
  /**
   * Recursively renders the children of the file tree.
   */
  const renderChildren = (treeChildrenData: FileNode[]): React.ReactNode[] => {
    return treeChildrenData
      .sort((a, b) => {
        if (a.isFile && b.isFile) {
          return a.label.localeCompare(b.label);
        }
        if (a.isFile) return 1; // Files come after folders
        if (b.isFile) return -1; // Folders come before files
        return a.label.localeCompare(b.label); // Sort folders alphabetically
      })
      .map((item) => {
        if (item.isFile) {
          return (
            <File
              key={item.id}
              value={item.id}
              isSelectable={item.isSelectable}
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(item);
              }}
              isSelect={selectedItem.path === item.path}
              className={selectedItem.path === item.path ? 'bg-gray-600' : ''}
            >
              <p>{item.label}</p>
            </File>
          );
        }

        if (item.children) {
          return (
            <Folder
              key={item.id}
              element={item.label}
              value={item.id}
              isSelectable={item.isSelectable}
              isSelect={selectedItem.path === item.path}
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(item);
              }}
              className={selectedItem.path === item.path ? 'bg-gray-600' : ''}
            >
              {renderChildren(item.children)}
            </Folder>
          );
        }

        return null;
      });
  };

  return <Tree className="p-2">{renderChildren(treeData)}</Tree>;
}
