import { FileStash } from "../../../../packages/filestash/src";
import { FileStashSchema, FileStashValue } from "@/types/filestash-schema";
import { FileNode } from "@/types/shared";

let db: FileStash<FileStashSchema>;
let stashReadyPromise: Promise<void> | null = null;

const assignmentWriteQueues = new Map<string, Promise<void>>();

const enqueueAssignmentWrite = async (
  key: string,
  operation: () => Promise<void>,
): Promise<void> => {
  const lastOperation = assignmentWriteQueues.get(key) ?? Promise.resolve();

  const nextOperation = lastOperation.catch(() => undefined).then(operation);

  assignmentWriteQueues.set(
    key,
    nextOperation.finally(() => {
      if (assignmentWriteQueues.get(key) === nextOperation) {
        assignmentWriteQueues.delete(key);
      }
    }),
  );

  await nextOperation;
};

export async function initStash() {
  if (typeof window === "undefined") {
    throw new Error("FileStash can only be initialized in a browser environment");
  }

  if (!db) {
    db = new FileStash<FileStashSchema>("eevee-workspace-db")
      .setVersion(1)
      .configureStore("assignments", { keyPath: "id" });
  }

  await db.open();
}

export async function ensureStashReady() {
  if (!stashReadyPromise) {
    stashReadyPromise = initStash().catch((error) => {
      stashReadyPromise = null;
      throw error;
    });
  }

  await stashReadyPromise;
}

export const getAssignmentKey = (assignmentId: number, userId: number) => {
  return `assignment-${assignmentId}-user-${userId}`;
};

export const saveFileTree = async (
  assignmentId: number,
  userId: number,
  fileTree: FileNode,
): Promise<void> => {
  await ensureStashReady();

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

export const getFileTree = async (
  assignmentId: number,
  userId: number,
): Promise<FileNode | null> => {
  await ensureStashReady();

  const key = getAssignmentKey(assignmentId, userId);
  const data = await db.get("assignments", key);
  return data?.fileTree || null;
};

export const updateFileContent = async (
  assignmentId: number,
  userId: number,
  filePath: string,
  content: string,
): Promise<void> => {
  await ensureStashReady();

  const key = getAssignmentKey(assignmentId, userId);

  await enqueueAssignmentWrite(key, async () => {
    const currentEntry = await db.get("assignments", key);
    const fileTree = currentEntry?.fileTree;

    if (!fileTree) {
      throw new Error(
        "File tree not found. Initialize it first with saveFileTree()",
      );
    }

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

export const getFileContent = async (
  assignmentId: number,
  userId: number,
  filePath: string,
): Promise<string | null> => {
  await ensureStashReady();

  const fileTree = await getFileTree(assignmentId, userId);

  if (!fileTree) return null;

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

export async function deleteAssignment(assignmentId: number, userId: number) {
  await ensureStashReady();

  const key = getAssignmentKey(assignmentId, userId);
  await db.delete("assignments", key);
}

export function closeStash() {
  if (db) {
    db.close();
  }

  stashReadyPromise = null;
}
