export type FileType = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  content?: string;
  children?: FileType[];
  lastModified: Date;
  isOpen?: boolean;
  parentId?: string;
};

export type NewItem = {
  name: string;
  parentId: string | null;
  type: 'file' | 'folder';
  isCreating: boolean;
};
