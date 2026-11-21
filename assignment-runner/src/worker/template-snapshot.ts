import { createHmac } from 'node:crypto';
import type { ExecutionTemplateSnapshot } from '@eevee/execution-contracts';

const TEMPLATE_SCOPE = /^eevee-template-t[1-9]\d*$/;
const SNAPSHOT_ID = /^[a-f0-9]{64}$/;

export type WorkerTemplateSnapshot = ExecutionTemplateSnapshot & {
  url: string;
  token: string;
};

/**
 * Gives a worker a five-minute, read-only grant for exactly one immutable
 * template snapshot. The signing secret stays in the runner process.
 */
export function workerTemplateSnapshotAccess(
  snapshot: ExecutionTemplateSnapshot,
): WorkerTemplateSnapshot {
  const secret = process.env.EEVEE_STORAGE_SIGNING_SECRET;
  const endpoint = process.env.EEVEE_WORKER_STORAGE_URL;
  if (!secret || secret.length < 32 || !endpoint) {
    throw new Error('Worker template storage is not configured');
  }
  if (
    snapshot.kind !== 'template' ||
    !TEMPLATE_SCOPE.test(snapshot.scope) ||
    !SNAPSHOT_ID.test(snapshot.id)
  ) {
    throw new Error('Invalid template snapshot reference');
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Invalid worker template storage URL');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Invalid worker template storage URL');
  }

  const encoded = Buffer.from(
    JSON.stringify({
      aud: 'eevee-file-storage-v1',
      scope: snapshot.scope,
      snapshotId: snapshot.id,
      permissions: ['read'],
      exp: Math.floor(Date.now() / 1000) + 300,
    }),
  ).toString('base64url');

  return {
    ...snapshot,
    url: url.origin,
    token: `${encoded}.${createHmac('sha256', secret)
      .update(encoded)
      .digest('base64url')}`,
  };
}
