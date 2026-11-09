import type { Scheduling } from "@/app/interface/platform-api/scheduling";
import { axiosClientWithAuth } from "../platform-api/client";

type FileRef = { digest: string; size: number };
type Workspace = {
  version: number;
  scope: string;
  revision: number;
  files: Record<string, FileRef>;
  limits?: { maxFileBytes: number; maxProjectBytes: number };
};
// Accepted remote revisions for this browser session.
const baselines = new Map<string, number>();

export type StorageWorkspace = {
  files: Record<string, string>;
  revision: number;
  baselineKey: string;
};
export type StorageDraft = "workspace" | "answer-key";
type StorageTarget = { draft?: StorageDraft; userId?: number };

type StorageGrant = {
  url: string;
  scope: string;
  token: string;
  expiresAt: number;
};
type WorkspaceSyncSession = {
  signal: AbortSignal;
  getGrant: (refresh?: boolean) => Promise<StorageGrant>;
};

function storageKey(grant: StorageGrant) {
  return `${grant.url}/${grant.scope}`;
}

async function getStorageGrant(
  assignmentId: number,
  { draft = "workspace", userId }: StorageTarget = {},
): Promise<StorageGrant> {
  const { data } = await axiosClientWithAuth.get<StorageGrant>(
    `/assignment-storage/${assignmentId}/${draft}/grant`,
  );
  if (userId !== undefined) {
    const suffix = draft === "answer-key" ? "-answer-key" : "";
    if (data.scope !== `eevee-u${userId}-a${assignmentId}${suffix}`) {
      throw new Error("A sessão mudou. Reabra o workspace para sincronizar.");
    }
  }
  return data;
}

function assertStoragePath(path: string) {
  if (
    !path ||
    path.length > 240 ||
    /[\\\x00-\x1f:]/.test(path) ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error("O servidor retornou um caminho de arquivo inválido.");
  }
}

function validateWorkspace(value: unknown, scope: string): Workspace {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("O servidor retornou um workspace inválido.");
  }
  const workspace = value as Workspace;
  if (
    workspace.version !== 1 ||
    workspace.scope !== scope ||
    !Number.isSafeInteger(workspace.revision) ||
    workspace.revision < 0 ||
    !workspace.files ||
    typeof workspace.files !== "object" ||
    Array.isArray(workspace.files)
  ) {
    throw new Error("O servidor retornou um workspace inválido.");
  }
  const { limits } = workspace;
  if (
    limits !== undefined &&
    (!limits ||
      !Number.isSafeInteger(limits.maxFileBytes) ||
      limits.maxFileBytes < 1 ||
      !Number.isSafeInteger(limits.maxProjectBytes) ||
      limits.maxProjectBytes < 1)
  ) {
    throw new Error("O servidor retornou limites de armazenamento inválidos.");
  }
  const entries = Object.entries(workspace.files);
  if (entries.length > 100)
    throw new Error("O servidor retornou arquivos demais.");
  for (const [name, ref] of entries) {
    assertStoragePath(name);
    const parts = name.split("/");
    if (
      parts
        .slice(0, -1)
        .some((_, i) =>
          Object.hasOwn(workspace.files, parts.slice(0, i + 1).join("/")),
        )
    ) {
      throw new Error("O servidor retornou caminhos de arquivo conflitantes.");
    }
    if (
      !ref ||
      typeof ref !== "object" ||
      Array.isArray(ref) ||
      typeof ref.digest !== "string" ||
      !/^[a-f0-9]{64}$/.test(ref.digest) ||
      !Number.isSafeInteger(ref.size) ||
      ref.size < 0
    ) {
      throw new Error(
        "O servidor retornou uma referência de arquivo inválida.",
      );
    }
  }
  if (workspace.revision === 0 && entries.length)
    throw new Error("Workspace sem revisão contém arquivos.");
  return workspace;
}

function sameReferences(a: Workspace["files"], b: Workspace["files"]) {
  const names = Object.keys(a);
  return (
    names.length === Object.keys(b).length &&
    names.every(
      (name) =>
        b[name]?.digest === a[name].digest && b[name]?.size === a[name].size,
    )
  );
}

function digest(bytes: Uint8Array) {
  return crypto.subtle
    .digest("SHA-256", bytes)
    .then((hash) =>
      Array.from(new Uint8Array(hash), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
    );
}

/**
 * Reads the current server workspace into the browser. It never changes the
 * local IndexedDB tree itself; the caller must obtain the student's consent
 * before replacing local work with this result.
 */
export async function downloadStorageWorkspace(
  assignmentId: number,
  target?: StorageTarget,
): Promise<StorageWorkspace> {
  const grant = await getStorageGrant(assignmentId, target);
  // Re-entering reconciliation revokes prior acceptance, including a failed download.
  baselines.delete(storageKey(grant));
  const base = `${grant.url}/v1/${grant.scope}`;
  const headers = { Authorization: `Bearer ${grant.token}` };
  const response = await fetch(`${base}/workspace`, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(
      `Não foi possível ler os arquivos do servidor (${response.status}).`,
    );
  }

  const workspace = validateWorkspace(await response.json(), grant.scope);
  const entries = Object.entries(workspace.files);

  const files: Record<string, string> = Object.create(null);
  for (const [path, ref] of entries) {
    const blobResponse = await fetch(`${base}/blobs/${ref.digest}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!blobResponse.ok) {
      throw new Error(
        `Não foi possível baixar ${path} (${blobResponse.status}).`,
      );
    }
    const bytes = new Uint8Array(await blobResponse.arrayBuffer());
    if (bytes.length !== ref.size || (await digest(bytes)) !== ref.digest) {
      throw new Error(`A verificação de integridade falhou para ${path}.`);
    }
    try {
      files[path] = new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: true,
      }).decode(bytes);
    } catch {
      throw new Error(`O arquivo ${path} não é UTF-8 válido.`);
    }
  }
  return {
    files,
    revision: workspace.revision,
    baselineKey: storageKey(grant),
  };
}

/** Record the server revision after reconciliation or explicit consent to replace it. */
export function rememberStorageWorkspace(workspace: StorageWorkspace) {
  if (workspace.baselineKey) {
    baselines.set(workspace.baselineKey, workspace.revision);
  }
}

const writes = new Map<string, Promise<unknown>>();

async function writeWorkspace(
  input: Pick<Scheduling, "assignmentId" | "files">,
  {
    draft = "workspace",
    userId,
    kind,
    session,
  }: StorageTarget & {
    kind?: "preview" | "submission" | "answer-key";
    session?: WorkspaceSyncSession;
  } = {},
): Promise<{ revision: number; id?: string }> {
  // Freeze this attempt before async hashing/network work; editor mutations must not change its bytes.
  const inputFiles = { ...input.files };
  const assignmentId = input.assignmentId;
  const signal = session?.signal;
  const queueKey = `${draft}:${assignmentId}`;
  const previous = writes.get(queueKey) ?? Promise.resolve();
  const operation = previous
    .catch(() => {})
    .then(async () => {
      signal?.throwIfAborted();
      let grant = await (
        session ? session.getGrant() : getStorageGrant(assignmentId, { draft, userId })
      );
      signal?.throwIfAborted();
      const key = storageKey(grant);
      const base = `${grant.url}/v1/${grant.scope}`;
      async function request(path: string, init: RequestInit = {}) {
        const send = () =>
          fetch(`${base}${path}`, {
            ...init,
            headers: {
              ...init.headers,
              Authorization: `Bearer ${grant.token}`,
            },
            signal: signal
              ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
              : AbortSignal.timeout(15_000),
          });
        let response = await send();
        // Storage checks authorization before applying the request.
        if (response.status === 403 && session) {
          const renewed = await session.getGrant(true);
          if (storageKey(renewed) !== key) {
            throw new Error(
              "O endereço do armazenamento mudou. Reabra o workspace para sincronizar.",
            );
          }
          grant = renewed;
          response = await send();
        }
        if (!response.ok) {
          if (response.status === 409)
            throw new Error(
              "Workspace alterado em outra aba. Seus arquivos locais foram preservados; reconcilie antes de enviar.",
            );
          throw new Error(
            `Armazenamento indisponível (${response.status}). Seus arquivos locais foram preservados.`,
          );
        }
        return response;
      }
      const remote = validateWorkspace(
        await (await request("/workspace")).json(),
        grant.scope,
      );
      const expected = baselines.get(key);
      if (expected !== undefined && expected !== remote.revision)
        throw new Error(
          "Conflito de versão: seus arquivos locais foram preservados. Recarregue somente após reconciliar.",
        );
      const files: Record<string, FileRef> = Object.create(null);
      let total = 0;
      if (Object.keys(inputFiles).length > 100)
        throw new Error("O armazenamento aceita até 100 arquivos por projeto.");
      for (const [name, content] of Object.entries(inputFiles).sort(
        ([a], [b]) => a.localeCompare(b),
      )) {
        assertStoragePath(name);
        const bytes = new TextEncoder().encode(content);
        total += bytes.length;
        files[name] = { digest: await digest(bytes), size: bytes.length };
      }
      // An unknown baseline may not overwrite an existing remote tree after reload/offline edits.
      if (
        expected === undefined &&
        remote.revision > 0 &&
        !sameReferences(remote.files, files)
      ) {
        throw new Error(
          "Existe uma versão remota diferente. Seus arquivos locais foram preservados; a mesclagem precisa ser feita antes do envio.",
        );
      }
      if (!kind && sameReferences(remote.files, files)) {
        baselines.set(key, remote.revision);
        return { revision: remote.revision };
      }
      const { limits } = remote;
      if (
        limits &&
        (total > limits.maxProjectBytes ||
          Object.values(files).some((ref) => ref.size > limits.maxFileBytes))
      ) {
        throw new Error(
          `O armazenamento aceita até ${limits.maxFileBytes} bytes por arquivo e ${limits.maxProjectBytes} bytes por projeto.`,
        );
      }
      for (const [name, ref] of Object.entries(files)) {
        if (remote.files[name]?.digest !== ref.digest) {
          await request(`/blobs/${ref.digest}`, {
            method: "PUT",
            body: new TextEncoder().encode(inputFiles[name]),
            headers: { "Content-Type": "application/octet-stream" },
          });
        }
      }
      const saved: Workspace = await (
        await request("/workspace", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Match": String(remote.revision),
          },
          body: JSON.stringify({ files }),
        })
      ).json();
      validateWorkspace(saved, grant.scope);
      if (
        saved.revision !== remote.revision + 1 ||
        !sameReferences(saved.files, files)
      ) {
        throw new Error(
          "O servidor confirmou um workspace diferente. Seus arquivos locais foram preservados.",
        );
      }
      baselines.set(key, saved.revision);
      if (!kind) return { revision: saved.revision };
      const snapshot: { id: string } = await (
        await request("/snapshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: saved.revision, kind }),
        })
      ).json();
      if (
        !snapshot ||
        typeof snapshot.id !== "string" ||
        !/^[a-f0-9]{64}$/.test(snapshot.id)
      ) {
        throw new Error(
          "O servidor retornou um snapshot inválido. Seus arquivos locais foram preservados.",
        );
      }
      return { revision: saved.revision, id: snapshot.id };
    });
  writes.set(queueKey, operation);
  try {
    return await operation;
  } finally {
    if (writes.get(queueKey) === operation) writes.delete(queueKey);
  }
}

export function createStorageWorkspaceSync(
  assignmentId: number,
  userId: number,
  signal: AbortSignal,
  draft: StorageDraft = "workspace",
) {
  let cachedGrant: StorageGrant | undefined;

  async function getGrant(refresh = false) {
    signal.throwIfAborted();
    if (refresh) cachedGrant = undefined;
    if (cachedGrant && cachedGrant.expiresAt * 1000 > Date.now() + 30_000) {
      return cachedGrant;
    }
    const grant = await getStorageGrant(assignmentId, { draft, userId });
    signal.throwIfAborted();
    cachedGrant = grant;
    return grant;
  }

  return (files: Record<string, string>) =>
    writeWorkspace({ assignmentId, files }, { draft, session: { signal, getGrant } });
}

export async function prepareStorageSubmission(
  input: Scheduling,
  kind: "preview" | "submission",
) {
  const snapshot = await writeWorkspace(input, { kind });
  return { assignmentId: input.assignmentId, sourceSnapshotId: snapshot.id! };
}

export function saveAnswerKeyDraft(input: Pick<Scheduling, "assignmentId" | "files">, userId: number) {
  return writeWorkspace(input, { draft: "answer-key", userId });
}

export async function prepareAnswerKeyRun(input: Scheduling, userId: number) {
  const snapshot = await writeWorkspace(input, {
    draft: "answer-key",
    kind: "answer-key",
    userId,
  });
  return { assignmentId: input.assignmentId, sourceSnapshotId: snapshot.id! };
}
