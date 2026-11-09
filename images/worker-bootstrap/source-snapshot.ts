import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { SourceSnapshot } from './types/worker-definition.type.js';

const LEGACY_BUNDLE_LIMIT = 8 * 1024 * 1024;
const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');

async function downloadSnapshot(source: SourceSnapshot) {
  const url = `${source.url}/v1/${source.scope}/snapshots/${source.id}/files`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${source.token}` },
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    }).catch(() => null);
    if (response?.ok && response.body) {
      // Older storage images sent bundles with chunked encoding.
      const limit = Number(response.headers.get('content-length') ?? LEGACY_BUNDLE_LIMIT);
      if (!Number.isSafeInteger(limit) || limit < 1)
        throw new RangeError('Invalid source snapshot transfer length');
      const chunks: Uint8Array[] = [];
      let total = 0;
      try {
        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
          total += chunk.length;
          if (total > limit) throw new RangeError('Source snapshot exceeds transfer length');
          chunks.push(chunk);
        }
        return Buffer.concat(chunks).toString('utf8');
      } catch (error) {
        if (error instanceof RangeError) throw error;
      }
    } else if (response) {
      await response.body?.cancel();
      if (response.status < 500 && response.status !== 429)
        throw new Error(`Source snapshot request rejected (${response.status})`);
    }
    if (attempt < 2) await delay(500 * (attempt + 1));
  }
  throw new Error('Source storage unavailable after retries');
}

export async function readSourceSnapshot(source: SourceSnapshot) {
  const { manifest, files } = JSON.parse(await downloadSnapshot(source));
  const { id, ...content } = manifest;
  if (id !== source.id || digest(JSON.stringify(content)) !== id ||
      manifest.scope !== source.scope || manifest.kind !== source.kind ||
      manifest.version !== 1 || !Number.isSafeInteger(manifest.revision) ||
      manifest.revision < 1 || !manifest.files || typeof manifest.files !== 'object' ||
      Array.isArray(manifest.files) || !files || typeof files !== 'object' ||
      Array.isArray(files)) {
    throw new Error('Invalid worker snapshot manifest');
  }
  const entries = Object.entries(manifest.files);
  if (entries.length > 100 || entries.length !== Object.keys(files).length)
    throw new Error('Invalid worker snapshot file count');

  const result: Record<string, string> = Object.create(null);
  const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
  for (const [name, raw] of entries) {
    const parts = name.split('/');
    if (!name || name.length > 240 || /[\\\x00-\x1f:]/.test(name) ||
        parts.some((part) => !part || part === '.' || part === '..') ||
        parts.slice(0, -1).some((_, i) => Object.hasOwn(manifest.files, parts.slice(0, i + 1).join('/')))) {
      throw new Error('Unsafe worker snapshot path');
    }
    const ref = raw as { digest: string; size: number };
    if (!ref || !Object.hasOwn(files, name) || typeof files[name] !== 'string')
      throw new Error('Missing worker snapshot file');
    const bytes = Buffer.from(files[name], 'base64');
    if (bytes.length !== ref.size || digest(bytes) !== ref.digest) {
      throw new Error('Worker snapshot integrity failure');
    }
    result[name] = decoder.decode(bytes);
  }
  return result;
}
