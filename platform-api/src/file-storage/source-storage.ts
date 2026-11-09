import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import type { ExecutionSourceSnapshot } from '@eevee/execution-contracts';

// Covers 100 paths of up to 240 UTF-16 units, including JSON escapes and blob references.
const MAX_SNAPSHOT_MANIFEST_BYTES = 256 * 1024;

export type StorageDraft = 'workspace' | 'answer-key';
export function storageConfig() {
  const secret = process.env.EEVEE_STORAGE_SIGNING_SECRET;
  if (!secret || secret.length < 32)
    throw new ServiceUnavailableException(
      'Source storage signing secret missing',
    );
  let url: URL;
  try {
    url = new URL(process.env.EEVEE_STORAGE_URL || 'http://127.0.0.1:3020');
  } catch {
    throw new ServiceUnavailableException('Invalid internal source storage URL');
  }
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', 'source-storage'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new ServiceUnavailableException(
      'Storage must use the internal service or a local loopback URL',
    );
  }
  const publicUrl = process.env.EEVEE_STORAGE_PUBLIC_URL || url.origin;
  // A same-origin route avoids returning the server's loopback address to students.
  if (publicUrl !== '/storage') {
    let parsed: URL;
    try {
      parsed = new URL(publicUrl);
    } catch {
      throw new ServiceUnavailableException('Invalid public storage URL');
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== '/'
    )
      throw new ServiceUnavailableException('Invalid public storage URL');
  }
  return { secret, url: url.origin, publicUrl: publicUrl.replace(/\/$/, '') };
}
export function storageScope(
  userId: number,
  assignmentId: number,
  draft: StorageDraft = 'workspace',
) {
  if (![userId, assignmentId].every((n) => Number.isSafeInteger(n) && n > 0))
    throw new BadRequestException('Invalid storage scope');
  const scope = `eevee-u${userId}-a${assignmentId}`;
  return draft === 'answer-key' ? `${scope}-answer-key` : scope;
}
export function createStorageGrant(
  userId: number,
  assignmentId: number,
  draft: StorageDraft = 'workspace',
) {
  const { secret, publicUrl } = storageConfig();
  const scope = storageScope(userId, assignmentId, draft);
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const encoded = Buffer.from(
    JSON.stringify({
      aud: 'eevee-file-storage-v1',
      scope,
      permissions: ['read', 'write'],
      exp: expiresAt,
    }),
  ).toString('base64url');
  const token = `${encoded}.${createHmac('sha256', secret).update(encoded).digest('base64url')}`;
  return { url: publicUrl, scope, token, expiresAt };
}
async function fetchBytes(url: string, token: string, max: number) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  }).catch(() => {
    throw new ServiceUnavailableException('Source storage is unavailable');
  });
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status >= 500)
      throw new ServiceUnavailableException('Source storage is unavailable');
    throw new BadRequestException('Storage reference is unavailable');
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (!response.body) throw new BadRequestException('Empty storage response');
  for await (const chunk of response.body as any) {
    total += chunk.length;
    if (total > max)
      throw new BadRequestException('Storage content exceeds byte limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function fetchSnapshotManifest(
  userId: number,
  assignmentId: number,
  id: string,
  kind: ExecutionSourceSnapshot['kind'],
  metadataOnly = false,
) {
  if (!/^[a-f0-9]{64}$/.test(id))
    throw new BadRequestException('Invalid snapshot reference');
  const grant = createStorageGrant(
    userId,
    assignmentId,
    kind === 'answer-key' ? 'answer-key' : 'workspace',
  );
  const prefix = `${storageConfig().url}/v1/${grant.scope}`;
  const manifest = JSON.parse(
    (
      await fetchBytes(
        `${prefix}/snapshots/${id}${metadataOnly ? '/manifest' : ''}`,
        grant.token,
        MAX_SNAPSHOT_MANIFEST_BYTES,
      )
    ).toString('utf8'),
  );
  const { id: returnedId, ...canonical } = manifest;
  if (
    returnedId !== id ||
    createHash('sha256').update(JSON.stringify(canonical)).digest('hex') !==
      id ||
    manifest.scope !== grant.scope ||
    manifest.kind !== kind ||
    manifest.version !== 1 ||
    !Number.isSafeInteger(manifest.revision) ||
    manifest.revision < 1 ||
    !manifest.files ||
    typeof manifest.files !== 'object' ||
    Array.isArray(manifest.files) ||
    Object.keys(manifest.files).length > 100
  ) {
    throw new BadRequestException('Invalid snapshot manifest');
  }
  return { manifest, prefix, grant };
}

export async function validateStorageSnapshotReference(
  userId: number,
  assignmentId: number,
  id: string,
  kind: ExecutionSourceSnapshot['kind'],
): Promise<ExecutionSourceSnapshot> {
  const { grant } = await fetchSnapshotManifest(userId, assignmentId, id, kind, true);
  return { scope: grant.scope, id, kind };
}

export async function resolveStorageSnapshot(
  userId: number,
  assignmentId: number,
  id: string,
  kind: ExecutionSourceSnapshot['kind'],
) {
  const { manifest, prefix, grant } = await fetchSnapshotManifest(userId, assignmentId, id, kind);
  const files: Record<string, string> = Object.create(null);
  for (const [name, raw] of Object.entries(manifest.files)) {
    if (
      !name ||
      name.length > 240 ||
      /[\\\x00-\x1f:]/.test(name) ||
      name.split('/').some((part) => !part || part === '.' || part === '..')
    )
      throw new BadRequestException('Unsafe snapshot path');
    const ref = raw as { digest: string; size: number };
    if (
      !ref ||
      !/^[a-f0-9]{64}$/.test(ref.digest) ||
      !Number.isSafeInteger(ref.size) ||
      ref.size < 0
    )
      throw new BadRequestException('Invalid snapshot file');
    const bytes = await fetchBytes(
      `${prefix}/blobs/${ref.digest}`,
      grant.token,
      ref.size,
    );
    if (
      bytes.length !== ref.size ||
      createHash('sha256').update(bytes).digest('hex') !== ref.digest
    )
      throw new BadRequestException('Snapshot integrity failure');
    try {
      files[name] = new TextDecoder('utf-8', {
        fatal: true,
        ignoreBOM: true,
      }).decode(bytes);
    } catch {
      throw new BadRequestException('Only UTF-8 source files are supported');
    }
  }
  return files;
}

export function readAttemptSource(attempt: {
  userId: number;
  assignmentId: number;
  sourceSnapshotId?: string | null;
  receivedWork?: Record<string, string> | null;
}) {
  return attempt.sourceSnapshotId
    ? resolveStorageSnapshot(attempt.userId, attempt.assignmentId, attempt.sourceSnapshotId, 'submission')
    : Promise.resolve(attempt.receivedWork ?? undefined);
}
