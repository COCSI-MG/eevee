import { FileStash } from "../../../../packages/filestash/src";
import { FileStashSchema, FileStashValue } from "@/types/filestash-schema";
import { FileNode } from "@/types/shared";

// Instância singleton do FileStash
let db: FileStash<FileStashSchema>;

const assignmentWriteQueues = new Map<string, Promise<void>>();

const enqueueAssignmentWrite = async (
  key: string,
  operation: () => Promise<void>
): Promise<void> => {
  const lastOperation = assignmentWriteQueues.get(key) ?? Promise.resolve();

  const nextOperation = lastOperation
    .catch(() => undefined)
    .then(operation);

  assignmentWriteQueues.set(
    key,
    nextOperation.finally(() => {
      if (assignmentWriteQueues.get(key) === nextOperation) {
        assignmentWriteQueues.delete(key);
      }
    })
  );

  await nextOperation;
};

/**
 * Inicializa o FileStash (abre a conexão)
 */
export async function initStash() {
  if (typeof window === "undefined") {
    throw new Error("FileStash can only be initialized in a browser environment");
  }

  if (!db) {
    db = new FileStash<FileStashSchema>("eevee-workspace-db")
      .setVersion(1)
      .configureStore("assignments", { keyPath: "id" }); // Usa 'id' como keyPath
  }

  await db.open();
}

/**
 * Gera a chave única para um assignment/usuário
 */
export const getAssignmentKey = (assignmentId: number, userId: number) => {
  return `assignment-${assignmentId}-user-${userId}`;
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

  await enqueueAssignmentWrite(key, async () => {
    const data: FileStashValue = {
      id: key,
      assignmentId,
      userId,
      fileTree,
      updatedAt: new Date().toISOString(),
    };

    await db.upsert("assignments", data);
  });
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
  const key = getAssignmentKey(assignmentId, userId);

  await enqueueAssignmentWrite(key, async () => {
    const currentEntry = await db.get("assignments", key);
    const fileTree = currentEntry?.fileTree;

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

    const updatedEntry: FileStashValue = {
      id: key,
      assignmentId,
      userId,
      fileTree,
      updatedAt: new Date().toISOString(),
    };

    await db.upsert("assignments", updatedEntry);
  });
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
