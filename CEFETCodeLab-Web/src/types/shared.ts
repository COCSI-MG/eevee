export type FileTreeData = {
  id: string;
  label: string;
  isSelectable: boolean;
  icon?: React.ReactNode;
  children?: FileTreeData[];
  isFile?: boolean;
}

export type NewItem = {
  name: string;
  parentId: string | null;
  type: 'file' | 'folder';
  isCreating: boolean;
};
