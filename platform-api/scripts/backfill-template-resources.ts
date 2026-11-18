import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { storeTemplateFile } from '../src/file-storage/template-storage';
import {
  backfillTemplateResourceSnapshots,
  type LegacyTemplateResource,
} from '../src/template/template-resource-backfill';

const apply = process.argv.includes('--apply');
const root = resolve(process.env.TEMPLATE_LEGACY_STORAGE_ROOT ?? 'templates-upload');

function isContained(root: string, target: string): boolean {
  const path = relative(root, target);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

/** Resolves both paths, preventing a symlink or junction from escaping root. */
export async function containedLegacyPath(root: string, value: string): Promise<string> {
  if (!value || isAbsolute(value)) throw new Error(`Unsafe legacy storage path: ${value}`);
  const canonicalRoot = await realpath(root);
  const candidate = resolve(canonicalRoot, value);
  if (!isContained(canonicalRoot, candidate)) {
    throw new Error(`Legacy storage path escapes configured root: ${value}`);
  }
  const canonicalCandidate = await realpath(candidate);
  if (!isContained(canonicalRoot, canonicalCandidate)) {
    throw new Error(`Legacy storage symlink escapes configured root: ${value}`);
  }
  return canonicalCandidate;
}

async function hasColumn(
  source: Pick<DataSource, 'query'>,
  column: string,
): Promise<boolean> {
  const rows = await source.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'template_resource' AND column_name = $1
     ) AS "exists"`,
    [column],
  );
  return Boolean(rows[0]?.exists);
}

export async function runTemplateResourceBackfill(options: {
  source: Pick<DataSource, 'query' | 'transaction'>;
  apply: boolean;
  root: string;
  read?: (path: string) => Promise<Buffer>;
  store?: typeof storeTemplateFile;
  resolvePath?: (root: string, path: string) => Promise<string>;
}): Promise<{ legacyCount: number; pendingSchema: string[]; updated: number }> {
  const { source, apply, root } = options;
  const [storagePath, snapshotId, digest, size] = await Promise.all([
    hasColumn(source, 'storagePath'), hasColumn(source, 'snapshotId'),
    hasColumn(source, 'digest'), hasColumn(source, 'size'),
  ]);
  if (!storagePath) return { legacyCount: 0, pendingSchema: [], updated: 0 };
  const pendingSchema = (['snapshotId', 'digest', 'size'] as const)
    .filter((column) => !({ snapshotId, digest, size })[column]);
  const hasSnapshotId = !pendingSchema.includes('snapshotId');
  if (hasSnapshotId) {
    const incompleteMetadata = pendingSchema.includes('digest') || pendingSchema.includes('size')
      ? '"snapshotId" IS NOT NULL'
      : '"snapshotId" IS NOT NULL AND ("digest" IS NULL OR "size" IS NULL)';
    const rows = await source.query(
      `SELECT COUNT(*)::integer AS "count" FROM "template_resource"
       WHERE ${incompleteMetadata}`,
    );
    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error('Snapshot metadata is incomplete; reconcile existing immutable snapshots before backfill.');
    }
  }
  if (hasSnapshotId) {
    const rows = await source.query(
      `SELECT COUNT(*)::integer AS "count" FROM "template_resource" legacy
       WHERE legacy."snapshotId" IS NULL
         AND legacy."storagePath" IS NOT NULL AND btrim(legacy."storagePath") <> ''
         AND EXISTS (
           SELECT 1 FROM "template_resource" current
           WHERE current."templateId" = legacy."templateId"
             AND current."snapshotId" IS NOT NULL
         )`,
    );
    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error('Template has mixed legacy and immutable snapshots; reconcile it before backfill.');
    }
  }
  // Valid before snapshot columns exist. Once they exist, select only rows
  // that still need conversion and still have a usable legacy source; never
  // republish a current immutable snapshot or touch new snapshot-only rows.
  const incompleteSnapshot = hasSnapshotId ? 'AND "snapshotId" IS NULL' : '';
  const legacy = await source.query(
    `SELECT "id", "templateId", "fileName", "storagePath" FROM "template_resource"
     WHERE "storagePath" IS NOT NULL AND btrim("storagePath") <> ''
     ${incompleteSnapshot}
     ORDER BY "templateId", "id"`,
  ) as LegacyTemplateResource[];
  if (!apply) return { legacyCount: legacy.length, pendingSchema, updated: 0 };

  for (const column of pendingSchema) {
    await source.query(`ALTER TABLE "template_resource" ADD COLUMN IF NOT EXISTS "${column}" ${column === 'size' ? 'integer' : 'character varying'}`);
  }
  const resolvePath = options.resolvePath ?? containedLegacyPath;
  const resolved = new Map<string, string>();
  // Validate every path before any immutable snapshot is written.
  for (const resource of legacy) {
    resolved.set(resource.storagePath, await resolvePath(root, resource.storagePath));
  }
  const updates = await backfillTemplateResourceSnapshots(legacy, {
    read: (path) => (options.read ?? readFile)(resolved.get(path) ?? path),
    store: options.store ?? storeTemplateFile,
  });
  await source.transaction(async (manager) => {
    for (const update of updates) {
      await manager.query(
        `UPDATE "template_resource"
         SET "snapshotId" = $1, "digest" = $2, "size" = $3
         WHERE "id" = $4`,
        [update.snapshotId, update.digest, update.size, update.id],
      );
    }
  });
  return { legacyCount: legacy.length, pendingSchema, updated: updates.length };
}

async function main(): Promise<void> {
  const source = new DataSource({
    type: 'postgres', host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432, username: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD, database: process.env.PG_DATABASE,
  });
  await source.initialize();
  try {
    const result = await runTemplateResourceBackfill({
      source, root, apply,
    });
    if (!apply) {
      console.log(`Dry run: ${result.legacyCount} legacy resource(s); pending columns: ${result.pendingSchema.join(', ') || 'none'}.`);
      console.log('No database or storage writes were made. Re-run with --apply after verification.');
    } else console.log(`Backfilled ${result.updated} template resource(s) into immutable snapshots.`);
  } finally { await source.destroy(); }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Template resource backfill failed:', error);
    process.exit(1);
  });
}
