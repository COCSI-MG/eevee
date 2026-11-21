import { createHash, createHmac } from 'node:crypto';
import { storageLimits } from './storage-limits';

const TEMPLATE_SCOPE = /^eevee-template-t[1-9]\d*$/;
const DIGEST = /^[a-f0-9]{64}$/;

export type StoredTemplateFile = { digest: string; size: number };
export type TemplateSnapshot = {
  id: string;
  scope: string;
  kind: 'template';
  revision: number;
  files: Record<string, StoredTemplateFile>;
};

export class TemplateStorageError extends Error {
  constructor(
    message: string,
    readonly unavailable = false,
  ) {
    super(message);
    this.name = 'TemplateStorageError';
  }
}

export function templateStorageScope(templateId: number): string {
  if (!Number.isSafeInteger(templateId) || templateId < 1) {
    throw new TemplateStorageError('Invalid template storage scope');
  }
  return `eevee-template-t${templateId}`;
}

export function safeTemplateFileName(value: string): string {
  if (
    !value ||
    value.length > 240 ||
    /[\\/\x00-\x1f:]/.test(value) ||
    value === '.' ||
    value === '..'
  ) {
    throw new TemplateStorageError('Invalid template resource name');
  }
  return value;
}

function config() {
  const secret = process.env.EEVEE_STORAGE_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new TemplateStorageError('Template storage signing secret is not configured', true);
  }
  let url: URL;
  try {
    url = new URL(process.env.EEVEE_STORAGE_URL || 'http://127.0.0.1:3020');
  } catch {
    throw new TemplateStorageError('Invalid internal template storage URL', true);
  }
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', 'source-storage'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new TemplateStorageError('Template storage must use an internal URL', true);
  }
  return { secret, url: url.origin };
}

function grant(
  scope: string,
  permissions: Array<'read' | 'write'>,
  snapshotId?: string,
): string {
  const { secret } = config();
  if (!TEMPLATE_SCOPE.test(scope) || (snapshotId && !DIGEST.test(snapshotId))) {
    throw new TemplateStorageError('Invalid template storage grant');
  }
  const encoded = Buffer.from(
    JSON.stringify({
      aud: 'eevee-file-storage-v1',
      scope,
      permissions,
      exp: Math.floor(Date.now() / 1000) + 300,
      ...(snapshotId ? { snapshotId } : {}),
    }),
  ).toString('base64url');
  return `${encoded}.${createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url')}`;
}

async function request(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  const { url } = config();
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  }).catch(() => {
    throw new TemplateStorageError('Template storage is unavailable', true);
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new TemplateStorageError(
      response.status >= 500
        ? 'Template storage is unavailable'
        : 'Template storage rejected the request',
      response.status >= 500,
    );
  }
  return response;
}

async function json(response: Response, maxBytes = 128 * 1024): Promise<any> {
  const length = Number(response.headers.get('content-length') ?? 0);
  if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) {
    await response.body?.cancel();
    throw new TemplateStorageError('Template storage response is too large');
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > maxBytes) throw new TemplateStorageError('Template storage response is too large');
  try {
    return JSON.parse(body.toString('utf8'));
  } catch {
    throw new TemplateStorageError('Template storage returned invalid JSON');
  }
}

function files(value: unknown): Record<string, StoredTemplateFile> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TemplateStorageError('Invalid template storage manifest');
  }
  const result: Record<string, StoredTemplateFile> = Object.create(null);
  const limits = storageLimits();
  let total = 0;
  for (const [name, ref] of Object.entries(value as Record<string, unknown>)) {
    safeTemplateFileName(name);
    if (
      !ref ||
      typeof ref !== 'object' ||
      !DIGEST.test((ref as StoredTemplateFile).digest) ||
      !Number.isSafeInteger((ref as StoredTemplateFile).size) ||
      (ref as StoredTemplateFile).size < 0 ||
      (ref as StoredTemplateFile).size > limits.maxFileBytes
    ) {
      throw new TemplateStorageError('Invalid template storage file reference');
    }
    total += (ref as StoredTemplateFile).size;
    if (total > limits.maxProjectBytes) throw new TemplateStorageError('Template resources exceed byte limit');
    result[name] = {
      digest: (ref as StoredTemplateFile).digest,
      size: (ref as StoredTemplateFile).size,
    };
  }
  return result;
}

async function workspace(scope: string) {
  const raw = await json(
    await request(`/v1/${scope}/workspace`, grant(scope, ['read'])),
  );
  if (!Number.isSafeInteger(raw?.revision) || raw.revision < 0 || raw.scope !== scope) {
    throw new TemplateStorageError('Invalid template storage workspace');
  }
  return { revision: raw.revision as number, files: files(raw.files) };
}

function validateSnapshot(value: unknown, scope: string): TemplateSnapshot {
  const raw = value as TemplateSnapshot;
  if (
    !raw ||
    !DIGEST.test(raw.id) ||
    raw.scope !== scope ||
    raw.kind !== 'template' ||
    !Number.isSafeInteger(raw.revision) ||
    raw.revision < 1
  ) {
    throw new TemplateStorageError('Invalid template storage snapshot');
  }
  return { ...raw, files: files(raw.files) };
}

/** Adds or replaces one file, then captures an immutable template snapshot. */
export async function storeTemplateFile(
  templateId: number,
  originalName: string,
  bytes: Buffer,
  committedFiles?: Record<string, StoredTemplateFile>,
): Promise<TemplateSnapshot> {
  const fileName = safeTemplateFileName(originalName);
  const { maxFileBytes } = storageLimits();
  if (bytes.length > maxFileBytes) {
    throw new TemplateStorageError(`Template resource exceeds ${maxFileBytes} bytes`);
  }
  // API callers supply the SQL-committed manifest: workspace may contain an
  // orphaned write after a SQL rollback. Never merge those uncommitted files.
  const baseFiles = committedFiles === undefined ? undefined : files(committedFiles);
  const scope = templateStorageScope(templateId);
  const digest = createHash('sha256').update(bytes).digest('hex');
  await request(`/v1/${scope}/blobs/${digest}`, grant(scope, ['write']), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: bytes,
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await workspace(scope);
    const nextFiles = { ...(baseFiles ?? current.files), [fileName]: { digest, size: bytes.length } };
    const saved = await request(`/v1/${scope}/workspace`, grant(scope, ['write']), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'If-Match': String(current.revision) },
      body: JSON.stringify({ files: nextFiles }),
    }).catch((error) => {
      if (error instanceof TemplateStorageError && !error.unavailable && attempt < 2) return null;
      throw error;
    });
    if (!saved) continue;
    const updated = await json(saved);
    const snapshot = await json(
      await request(`/v1/${scope}/snapshots`, grant(scope, ['write']), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: updated.revision, kind: 'template' }),
      }),
    );
    return validateSnapshot(snapshot, scope);
  }
  throw new TemplateStorageError('Template storage changed concurrently');
}
