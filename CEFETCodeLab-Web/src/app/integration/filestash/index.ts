import { FileStash } from "../../../../packages/filestash/src";
import { FileStashSchema, FileStashValue } from "@/types/filestash-schema";
import { FileNode } from "@/types/shared";

// Instância singleton do FileStash
const db = new FileStash<FileStashSchema>("eevee-workspace-db")
  .setVersion(1)
  .configureStore("assignments", { keyPath: "id" }); // Usa 'id' como keyPath

/**
 * Inicializa o FileStash (abre a conexão)
 */
export async function initStash() {
  await db.open();
}

/**
 * Gera a chave única para um assignment/usuário
 */
export const getAssignmentKey = (assignmentId: number, userId?: number) => {
  return `assignment-${assignmentId}-user-${userId || 0}`;
};

/**
 * Salva a árvore completa de arquivos para um assignment
 */
export const saveFileTree = async (
  assignmentId: number,
  userId: number,
  fileTree: FileNode
): Promise<void> => {
  const key = getAssignmentKey(assignmentId, userId);

  const data: FileStashValue = {
    id: key, // id é usado como keyPath
    assignmentId,
    userId,
    fileTree,
    updatedAt: new Date().toISOString(),
  };

  await db.upsert("assignments", data);
};

/**
 * Busca a árvore completa de arquivos de um assignment
 */
export const getFileTree = async (
  assignmentId: number,
  userId: number
): Promise<FileNode | null> => {
  const key = getAssignmentKey(assignmentId, userId);
  const data = await db.get("assignments", key);
  return data?.fileTree || null;
};

/**
 * Atualiza o conteúdo de um arquivo específico na árvore
 */
export const updateFileContent = async (
  assignmentId: number,
  userId: number,
  filePath: string,
  content: string
): Promise<void> => {
  const fileTree = await getFileTree(assignmentId, userId);

  if (!fileTree) {
    throw new Error(
      "File tree not found. Initialize it first with saveFileTree()"
    );
  }

  // Função recursiva para encontrar e atualizar o arquivo
  const updateNode = (node: FileNode): boolean => {
    if (node.path === filePath && node.isFile) {
      node.content = content;
      node.updatedAt = new Date().toISOString();
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        const updated = updateNode(child);
        if (updated) {
          return true;
        }
      }
    }
    return false;
  };

  const updated = updateNode(fileTree);

  if (!updated) {
    console.warn(`File not found in tree: ${filePath}`);
    return;
  }

  await saveFileTree(assignmentId, userId, fileTree);
};

/**
 * Busca o conteúdo de um arquivo específico
 */
export const getFileContent = async (
  assignmentId: number,
  userId: number,
  filePath: string
): Promise<string | null> => {
  const fileTree = await getFileTree(assignmentId, userId);

  if (!fileTree) return null;

  // Função recursiva para encontrar o arquivo
  const findNode = (node: FileNode): string | null => {
    if (node.path === filePath && node.isFile) {
      return node.content || null;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(child);
        if (found !== null) return found;
      }
    }
    return null;
  };

  return findNode(fileTree);
};

/**
 * Remove um assignment do IndexedDB
 */
export async function deleteAssignment(assignmentId: number, userId: number) {
  const key = getAssignmentKey(assignmentId, userId);
  await db.delete("assignments", key);
}

/**
 * Fecha a conexão com o IndexedDB
 */
export function closeStash() {
  db.close();
}
