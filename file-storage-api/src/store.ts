import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { assertSupported, atomic, mkdir, syncExisting } from "./durability";
import { fail, hasErrorCode } from "./errors";
import {
  DIGEST_PATTERN,
  SCOPE_PATTERN,
  isRecord,
  type FileManifest,
  type FileReference,
  type SnapshotKind,
  type SnapshotManifest,
  type WorkspaceManifest,
} from "./models";

export interface StorageLimits {
  maxFileBytes: number;
  maxProjectBytes: number;
}

export const DEFAULT_STORAGE_LIMITS: Readonly<StorageLimits> = {
  maxFileBytes: 1024 * 1024,
  maxProjectBytes: 5 * 1024 * 1024,
};
const MAX_FILES = 100;

interface BlobReceipt extends FileReference {
  deduplicated: boolean;
}

export function hash(bytes: string | Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireDigest(value: unknown): string {
  if (typeof value !== "string" || !DIGEST_PATTERN.test(value)) {
    fail(400, "Invalid digest");
  }
  return value;
}

export function validateFilePath(value: string): void {
  if (
    !value ||
    value.length > 240 ||
    /[\\\x00-\x1f:]/.test(value) ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    fail(400, "Unsafe file path");
  }
}

function validSnapshotKind(scope: string, kind: unknown): kind is SnapshotKind {
  return scope.endsWith("-answer-key")
    ? kind === "answer-key"
    : kind === "preview" || kind === "submission";
}

function readStoredFile(file: string, missingMessage: string): Buffer {
  try {
    return readFileSync(file);
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) fail(404, missingMessage);
    throw error;
  }
}

export class Store {
  readonly root: string;

  constructor(
    root: string,
    readonly limits: Readonly<StorageLimits> = DEFAULT_STORAGE_LIMITS,
  ) {
    this.root = resolve(root);
    assertSupported(this.root);
    mkdir(this.root);
  }

  private scopeDirectory(scope: string): string {
    if (!SCOPE_PATTERN.test(scope)) fail(400, "Invalid scope");
    return join(this.root, "scopes", scope);
  }

  private blobPath(scope: string, id: string): string {
    return join(this.scopeDirectory(scope), "blobs", requireDigest(id));
  }

  putBlob(scope: string, id: string, bytes: Buffer): BlobReceipt {
    if (bytes.length > this.limits.maxFileBytes) fail(413, "File exceeds byte limit");
    if (hash(bytes) !== requireDigest(id)) fail(422, "Digest mismatch");

    const file = this.blobPath(scope, id);
    const deduplicated = existsSync(file);
    if (deduplicated) {
      this.getBlob(scope, id);
      syncExisting(file);
    } else {
      atomic(file, bytes);
    }
    return { digest: id, size: bytes.length, deduplicated };
  }

  getBlob(scope: string, id: string): Buffer {
    const bytes = readStoredFile(this.blobPath(scope, id), "Blob not found");
    if (hash(bytes) !== id) fail(422, "Stored blob corrupt");
    return bytes;
  }

  private validateFiles(
    scope: string,
    files: unknown,
    verifyBlobs: boolean,
    writeLimits?: Readonly<StorageLimits>,
  ): FileManifest {
    if (!isRecord(files)) fail(400, "Invalid manifest");
    const paths = Object.keys(files).sort();
    if (paths.length > MAX_FILES) fail(400, "Invalid manifest");

    const normalized: FileManifest = Object.create(null);
    let total = 0;
    for (const path of paths) {
      validateFilePath(path);
      const parts = path.split("/");
      const ancestorIsFile = parts.slice(0, -1).some((_, index) =>
        Object.hasOwn(files, parts.slice(0, index + 1).join("/")),
      );
      if (ancestorIsFile) fail(400, "File/directory path collision");

      const ref = files[path];
      if (
        !isRecord(ref) ||
        typeof ref.size !== "number" ||
        !Number.isSafeInteger(ref.size) ||
        ref.size < 0
      ) {
        fail(400, "Invalid file size");
      }
      if (writeLimits) {
        if (ref.size > writeLimits.maxFileBytes) fail(413, "File exceeds byte limit");
        total += ref.size;
        if (total > writeLimits.maxProjectBytes) fail(413, "Project exceeds byte limit");
      }
      const digest = requireDigest(ref.digest);
      if (verifyBlobs && this.getBlob(scope, digest).length !== ref.size) {
        fail(422, "File size mismatch");
      }
      normalized[path] = { digest, size: ref.size };
    }
    return normalized;
  }

  workspace(scope: string): WorkspaceManifest {
    const file = join(this.scopeDirectory(scope), "workspace.json");
    let manifest: unknown;
    try {
      manifest = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      if (hasErrorCode(error, "ENOENT")) {
        return { version: 1, scope, revision: 0, files: {} };
      }
      throw error;
    }

    if (
      !isRecord(manifest) ||
      manifest.version !== 1 ||
      manifest.scope !== scope ||
      typeof manifest.revision !== "number" ||
      !Number.isSafeInteger(manifest.revision) ||
      manifest.revision < 0
    ) {
      fail(422, "Invalid workspace");
    }
    const files = this.validateFiles(scope, manifest.files, false);
    return { version: 1, scope, revision: manifest.revision, files: { ...files } };
  }

  saveWorkspace(
    scope: string,
    expectedRevision: number,
    files: unknown,
  ): WorkspaceManifest {
    // Keep the revision check and write synchronous under the single-writer deployment.
    const current = this.workspace(scope);
    if (expectedRevision !== current.revision) {
      fail(409, "Workspace changed; keep local edits and reconcile");
    }
    const manifest: WorkspaceManifest = {
      version: 1,
      scope,
      revision: current.revision + 1,
      files: this.validateFiles(scope, files, true, this.limits),
    };
    const file = join(this.scopeDirectory(scope), "workspace.json");
    atomic(file, JSON.stringify(manifest));
    return manifest;
  }

  snapshot(scope: string, revision: unknown, kind: unknown): SnapshotManifest {
    if (!validSnapshotKind(scope, kind)) fail(400, "Invalid snapshot kind");
    const workspace = this.workspace(scope);
    if (revision !== workspace.revision || revision === 0) {
      fail(409, "Workspace revision changed");
    }

    // The serialized manifest determines its ID and is verified by the bootstrap.
    const manifest: Omit<SnapshotManifest, "id"> = {
      version: 1,
      scope,
      revision,
      kind,
      files: this.validateFiles(scope, workspace.files, true),
    };
    const bytes = JSON.stringify(manifest);
    const id = hash(bytes);
    const file = join(this.scopeDirectory(scope), "snapshots", id);
    if (existsSync(file)) {
      this.getSnapshot(scope, id);
      syncExisting(file);
    } else {
      atomic(file, bytes);
    }
    return { id, ...manifest };
  }

  getSnapshot(
    scope: string,
    id: string,
    { verifyBlobs = true }: { verifyBlobs?: boolean } = {},
  ): SnapshotManifest {
    const file = join(this.scopeDirectory(scope), "snapshots", requireDigest(id));
    const bytes = readStoredFile(file, "Snapshot not found");
    if (hash(bytes) !== id) fail(422, "Snapshot corrupt");

    const manifest: unknown = JSON.parse(bytes.toString("utf8"));
    if (
      !isRecord(manifest) ||
      manifest.scope !== scope ||
      manifest.version !== 1 ||
      !validSnapshotKind(scope, manifest.kind) ||
      typeof manifest.revision !== "number" ||
      !Number.isSafeInteger(manifest.revision) ||
      manifest.revision < 1
    ) {
      fail(422, "Invalid snapshot");
    }
    const files = this.validateFiles(scope, manifest.files, verifyBlobs);
    return {
      id,
      version: 1,
      scope,
      revision: manifest.revision,
      kind: manifest.kind,
      files: { ...files },
    };
  }

  verify(): void {
    const scopes = join(this.root, "scopes");
    if (!existsSync(scopes)) return;

    for (const scope of readdirSync(scopes)) {
      const directory = this.scopeDirectory(scope);
      const blobs = join(directory, "blobs");
      if (existsSync(blobs)) {
        for (const id of readdirSync(blobs)) this.getBlob(scope, id);
      }
      this.validateFiles(scope, this.workspace(scope).files, true);
      const snapshots = join(directory, "snapshots");
      if (existsSync(snapshots)) {
        for (const id of readdirSync(snapshots)) this.getSnapshot(scope, id);
      }
    }
  }
}
