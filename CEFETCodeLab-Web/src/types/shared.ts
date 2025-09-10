export type FileNode = {
  id: string;
  label: string;
  isSelectable: boolean;
  path: string;
  icon?: React.ReactNode;
  children?: FileNode[];
  isFile?: boolean;
}

export interface SelectedItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
}