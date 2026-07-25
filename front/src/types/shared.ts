export type FileNode = {
  id: string;
  isSelectable: boolean;
  path: string;
  icon?: React.ReactNode;
  children?: FileNode[];
  isFile?: boolean;
  content?: string; // Conteúdo do arquivo (apenas para isFile: true)
  updatedAt?: string; // Timestamp de última atualização
};

export interface SelectedItem {
  id: string;
  type: "file" | "folder";
  path: string;
}

export interface SelectedTemplate {
  templateId: number;
  name: string;
  params: {
    templateParamId: number;
    value: string;
  }[];
  weight?: number;
}

export interface SelectedUser {
  id: number;
  name: string;
  email: string;
}
