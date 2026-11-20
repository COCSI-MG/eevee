import { FileStash } from "../../../../packages/filestash/src";
import { FileStashSchema, FileStashValue } from "@/types/filestash-schema";
import { FileNode } from "@/types/shared";

let db: FileStash<FileStashSchema>;
let stashReadyPromise: Promise<void> | null = null;

export type LocalWorkspaceSnapshot = {
  fileTree: FileNode | null;
  revision: number;
  generation: string | null;
};
export type LocalWorkspaceReplacement = {
  applied: boolean;
  snapshot: LocalWorkspaceSnapshot;
};

const snapshotOf = (
  value: FileStashValue | undefined,
): LocalWorkspaceSnapshot => {
  const revision = value?.revision ?? 0;
  if (!Number.isSafeInteger(revision) || revision < 0)
    throw new Error("Invalid local workspace revision");
  const generation = value?.generation ?? null;
  if (generation !== null && (typeof generation !== "string" || !generation))
    throw new Error("Invalid local workspace generation");
  return { fileTree: value?.fileTree ?? null, revision, generation };
};
const copyTree = (tree: FileNode): FileNode => JSON.parse(JSON.stringify(tree));

/** Callback must be synchronous: the read, comparison and write share one native
 * readwrite transaction. IndexedDB serializes this store across tabs/connections.
 * Resolve only on commit, never merely on the put request's success. */
async function updateAssignmentAtomically<TResult>(
  key: string,
  update: (current: FileStashValue | undefined) => {
    value?: FileStashValue;
    remove?: boolean;
    result: TResult;
  },
): Promise<TResult> {
  await ensureStashReady();
  const connection = await db.open();
  return new Promise<TResult>((resolve, reject) => {
    const transaction = connection.transaction(["assignments"], "readwrite", {
      durability: "strict",
    });
    const store = transaction.objectStore("assignments");
    let result: TResult;
    let failure: unknown;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () =>
      reject(
        failure ??
          transaction.error ??
          new Error("Local workspace transaction aborted"),
      );
    transaction.onerror = () => {
      failure ??= transaction.error;
    };
    const request = store.get(key);
    request.onsuccess = () => {
      try {
        const change = update(request.result as FileStashValue | undefined);
        result = change.result;
        if (change.value) store.put(change.value);
        else if (change.remove) store.delete(key);
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
  });
}

function nextRevision(current: FileStashValue | undefined) {
  const revision = snapshotOf(current).revision + 1;
  if (!Number.isSafeInteger(revision))
    throw new Error("Local workspace revision limit reached");
  return revision;
}

export async function initStash() {
  if (typeof window === "undefined") {
    throw new Error(
      "FileStash can only be initialized in a browser environment",
    );
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
  const frozenTree = copyTree(fileTree);
  const key = getAssignmentKey(assignmentId, userId);
  await updateAssignmentAtomically(key, (current) => ({
    value: {
      id: key,
      assignmentId,
      userId,
      fileTree: frozenTree,
      revision: nextRevision(current),
      generation: current?.generation ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    },
    result: undefined,
  }));
};

export const getFileTreeSnapshot = async (
  assignmentId: number,
  userId: number,
): Promise<LocalWorkspaceSnapshot> => {
  await ensureStashReady();
  return snapshotOf(
    await db.get("assignments", getAssignmentKey(assignmentId, userId)),
  );
};

export const getFileTree = async (
  assignmentId: number,
  userId: number,
): Promise<FileNode | null> =>
  (await getFileTreeSnapshot(assignmentId, userId)).fileTree;

/** A stale confirmation cannot overwrite a save from another tab. A snapshot
 * compares both revision and tree to cover legacy entries without a revision. */
export const compareAndReplaceFileTree = async (
  assignmentId: number,
  userId: number,
  expected: LocalWorkspaceSnapshot,
  replacement: FileNode,
  isCurrent: () => boolean = () => true,
): Promise<LocalWorkspaceReplacement> => {
  const expectedRevision = expected.revision;
  const expectedGeneration = expected.generation ?? null;
  const expectedTree = JSON.stringify(expected.fileTree);
  const frozenTree = copyTree(replacement);
  const key = getAssignmentKey(assignmentId, userId);
  return updateAssignmentAtomically<LocalWorkspaceReplacement>(
    key,
    (current) => {
      const snapshot = snapshotOf(current);
      if (
        !isCurrent() ||
        snapshot.revision !== expectedRevision ||
        snapshot.generation !== expectedGeneration ||
        JSON.stringify(snapshot.fileTree) !== expectedTree
      ) {
        return { result: { applied: false, snapshot } };
      }
      const revision = nextRevision(current);
      const generation = current?.generation ?? crypto.randomUUID();
      return {
        value: {
          id: key,
          assignmentId,
          userId,
          fileTree: frozenTree,
          revision,
          generation,
          updatedAt: new Date().toISOString(),
        },
        result: {
          applied: true,
          snapshot: { fileTree: frozenTree, revision, generation },
        },
      };
    },
  );
};

export const updateFileContent = async (
  assignmentId: number,
  userId: number,
  filePath: string,
  content: string,
): Promise<void> => {
  const key = getAssignmentKey(assignmentId, userId);
  await updateAssignmentAtomically(key, (current) => {
    if (!current?.fileTree)
      throw new Error(
        "File tree not found. Initialize it first with saveFileTree()",
      );
    const updateNode = (node: FileNode): boolean => {
      if (node.path === filePath && node.isFile) {
        node.content = content;
        node.updatedAt = new Date().toISOString();
        return true;
      }
      return node.children?.some(updateNode) ?? false;
    };
    if (!updateNode(current.fileTree)) return { result: undefined };
    return {
      value: {
        ...current,
        revision: nextRevision(current),
        generation: current?.generation ?? crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
      },
      result: undefined,
    };
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
  await updateAssignmentAtomically(
    getAssignmentKey(assignmentId, userId),
    () => ({ remove: true, result: undefined }),
  );
}

export function closeStash() {
  if (db) {
    db.close();
  }

  stashReadyPromise = null;
}
