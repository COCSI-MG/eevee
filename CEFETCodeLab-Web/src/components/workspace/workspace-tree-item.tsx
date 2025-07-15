import { FileTreeData } from "@/types/shared";
import { File, Folder, Tree } from "../magicui/file-tree";

interface WorkspaceFileTreeProps {
  treeData: FileTreeData[];
  onFileSelect: (file: string) => void;
}

export default function WorkspaceFileTree({
  treeData,
  onFileSelect,
}: WorkspaceFileTreeProps) {
  const root = treeData[0];

  /**
   * Recursively renders the children of the file tree.
   */
  const renderChildren = (
    treeChildrenData: FileTreeData[],
    isRoot: boolean
  ): React.ReactNode[] => {
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
              onClick={() => onFileSelect(item.id)}
              isSelect={isRoot ? true : false}
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
            >
              {renderChildren(item.children, false)}
            </Folder>
          );
        }

        return null;
      });
  };

  return (
    <Tree>
      <Folder element={root.label} value={root.id}>
        {root.children && renderChildren(root.children, true)}
      </Folder>
    </Tree>
  );
}
