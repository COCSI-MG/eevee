import { FileNode } from "./shared";

/**
 * Schema simplificado do IndexedDB
 * 
 * Estratégia: 1 Assignment = 1 Entry
 * Chave: "assignment-{assignmentId}-user-{userId}"
 * Valor: Árvore completa de FileNode[]
 */
export type FileStashSchema = {
  assignments: {
    key: string; // Ex: "assignment-1-user-123"
    value: {
      id: string; // Mesma chave (necessário para keyPath)
      assignmentId: number;
      userId: number;
      fileTree: FileNode[]; // Árvore completa de arquivos/pastas
      updatedAt: string; // Última atualização
    };
  };
};

/**
 * Helper type para o valor armazenado no IndexedDB
 */
export type FileStashValue = FileStashSchema['assignments']['value'];

/**
 * Helper type para a chave do IndexedDB
 */
export type FileStashKey = FileStashSchema['assignments']['key'];
