import { createHash } from 'node:crypto';
import type { TemplateSnapshot } from 'src/file-storage/template-storage';

export type LegacyTemplateResource = {
  id: number;
  templateId: number;
  fileName: string;
  storagePath: string;
};

export type SnapshotBackfill = {
  id: number;
  snapshotId: string;
  digest: string;
  size: number;
};

/**
 * Converts legacy filesystem metadata through the storage API without ever
 * treating absent snapshot IDs as empty fixtures. The caller owns filesystem
 * containment checks and database writes; this function is side-effect free
 * apart from its injected read/store operations, making it safe to unit test.
 */
export async function backfillTemplateResourceSnapshots(
  resources: LegacyTemplateResource[],
  operations: {
    read: (storagePath: string) => Promise<Buffer>;
    store: (templateId: number, fileName: string, bytes: Buffer) => Promise<TemplateSnapshot>;
  },
): Promise<SnapshotBackfill[]> {
  const byTemplate = new Map<number, LegacyTemplateResource[]>();
  for (const resource of resources) {
    if (!Number.isSafeInteger(resource.id) || !Number.isSafeInteger(resource.templateId)) {
      throw new Error('Invalid legacy template resource');
    }
    const group = byTemplate.get(resource.templateId) ?? [];
    group.push(resource);
    byTemplate.set(resource.templateId, group);
  }

  const result: SnapshotBackfill[] = [];
  for (const [templateId, group] of byTemplate) {
    let snapshot: TemplateSnapshot | undefined;
    for (const resource of group) {
      const bytes = await operations.read(resource.storagePath);
      snapshot = await operations.store(templateId, resource.fileName, bytes);
    }
    if (!snapshot) continue;
    for (const resource of group) {
      const reference = snapshot.files[resource.fileName];
      if (!reference) {
        throw new Error(`Storage snapshot omitted legacy template resource: ${resource.fileName}`);
      }
      result.push({
        id: resource.id,
        snapshotId: snapshot.id,
        digest: reference.digest,
        size: reference.size,
      });
    }
  }
  return result;
}
