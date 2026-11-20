import type { ExecutionSourceSnapshot } from "@eevee/execution-contracts";

export interface FileReference {
  digest: string;
  size: number;
}

export type FileManifest = Record<string, FileReference>;

export interface WorkspaceManifest {
  version: 1;
  scope: string;
  revision: number;
  files: FileManifest;
}

export type SnapshotManifest = WorkspaceManifest & ExecutionSourceSnapshot;

export type SnapshotKind = ExecutionSourceSnapshot["kind"];

export const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
export const SCOPE_PATTERN = /^[a-z0-9-]{1,100}$/;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
