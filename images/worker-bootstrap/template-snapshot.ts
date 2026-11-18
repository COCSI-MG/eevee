import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { TemplateSnapshot } from './types/worker-definition.type.js';
import { normalizedFileDestination } from './file-handler.js';

// Files are capped at 8 MiB before JSON/base64 framing. Base64 expands the
// payload by 4/3, and the manifest adds bounded overhead (100 names of 240
// bytes), so 12 MiB safely admits every valid storage snapshot.
export const MAX_TEMPLATE_BUNDLE_BYTES = 12 * 1024 * 1024;
const TEMPLATE_SCOPE = /^eevee-template-t[1-9]\d*$/;
const SNAPSHOT_ID = /^[a-f0-9]{64}$/;

const digest = (bytes: Buffer | string) =>
  createHash('sha256').update(bytes).digest('hex');

/** Merges immutable fixture files without allowing conflicting shadowing. */
export function mergeTemplateSnapshotFiles(
  target: Record<string, Buffer>,
  incoming: Record<string, Buffer>,
  testFiles: Record<string, string>,
  testPath: string,
): void {
  const testDestinations = new Set(
    Object.keys(testFiles).map((name) => normalizedFileDestination(name, testPath)),
  );
  for (const [name, content] of Object.entries(incoming)) {
    // Platform API accepts a basename only. Reject nested paths here too so
    // merge and writer agree on one destination normalization step.
    if (name.includes('/')) {
      throw new Error(`Nested template resource path is not supported: ${name}`);
    }
    const destination = normalizedFileDestination(name, testPath);
    if (testDestinations.has(destination)) {
      throw new Error(`Template resource path collision: ${destination}`);
    }
    // The same canonical CSV may be attached by separate templates. It is
    // safe to keep one byte-identical copy, but never to overwrite content.
    if (Object.hasOwn(target, destination)) {
      if (!target[destination].equals(content)) {
        throw new Error(`Template resource path collision: ${destination}`);
      }
      continue;
    }
    target[destination] = content;
  }
}

function validatePath(name: string, files: Record<string, unknown>) {
  const parts = name.split('/');
  if (
    !name ||
    name.length > 240 ||
    /[\\\x00-\x1f:]/.test(name) ||
    parts.some((part) => !part || part === '.' || part === '..') ||
    parts.slice(0, -1).some((_, index) =>
      Object.hasOwn(files, parts.slice(0, index + 1).join('/')),
    )
  ) {
    throw new Error('Unsafe template snapshot path');
  }
}

async function download(snapshot: TemplateSnapshot): Promise<string> {
  if (
    snapshot.kind !== 'template' ||
    !TEMPLATE_SCOPE.test(snapshot.scope) ||
    !SNAPSHOT_ID.test(snapshot.id)
  ) {
    throw new Error('Invalid template snapshot reference');
  }
  const endpoint = `${snapshot.url}/v1/${snapshot.scope}/snapshots/${snapshot.id}/files`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${snapshot.token}` },
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    }).catch(() => null);
    if (response?.ok && response.body) {
      const contentLength = Number(response.headers.get('content-length') ?? 0);
      if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_TEMPLATE_BUNDLE_BYTES) {
        throw new RangeError('Template snapshot exceeds transfer limit');
      }
      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
          total += chunk.length;
          if (total > MAX_TEMPLATE_BUNDLE_BYTES) {
            throw new RangeError('Template snapshot exceeds transfer limit');
          }
          chunks.push(chunk);
        }
        return Buffer.concat(chunks).toString('utf8');
      } catch (error) {
        if (error instanceof RangeError) throw error;
      }
    } else if (response) {
      await response.body?.cancel();
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Template snapshot request rejected (${response.status})`);
      }
    }
    if (attempt < 2) await delay(500 * (attempt + 1));
  }
  throw new Error('Template storage unavailable after retries');
}

export async function readTemplateSnapshot(
  snapshot: TemplateSnapshot,
): Promise<Record<string, Buffer>> {
  const { manifest, files } = JSON.parse(await download(snapshot));
  const { id, ...canonical } = manifest ?? {};
  if (
    id !== snapshot.id ||
    digest(JSON.stringify(canonical)) !== id ||
    manifest.scope !== snapshot.scope ||
    manifest.kind !== 'template' ||
    manifest.version !== 1 ||
    !Number.isSafeInteger(manifest.revision) ||
    manifest.revision < 1 ||
    !manifest.files ||
    typeof manifest.files !== 'object' ||
    Array.isArray(manifest.files) ||
    !files ||
    typeof files !== 'object' ||
    Array.isArray(files)
  ) {
    throw new Error('Invalid template snapshot manifest');
  }

  const entries = Object.entries(manifest.files);
  if (entries.length > 100 || entries.length !== Object.keys(files).length) {
    throw new Error('Invalid template snapshot file count');
  }
  const decoded: Record<string, Buffer> = Object.create(null);
  for (const [name, raw] of entries) {
    validatePath(name, manifest.files);
    const ref = raw as { digest: string; size: number };
    if (
      !ref ||
      !/^[a-f0-9]{64}$/.test(ref.digest) ||
      !Number.isSafeInteger(ref.size) ||
      ref.size < 0 ||
      !Object.hasOwn(files, name) ||
      typeof files[name] !== 'string'
    ) {
      throw new Error('Invalid template snapshot file');
    }
    const encoded = files[name];
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.toString('base64') !== encoded) {
      throw new Error('Invalid template snapshot encoding');
    }
    if (bytes.length !== ref.size || digest(bytes) !== ref.digest) {
      throw new Error('Template snapshot integrity failure');
    }
    decoded[name] = bytes;
  }
  return decoded;
}
