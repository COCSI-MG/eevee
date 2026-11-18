import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The preceding migration creates snapshot-backed rows. Keep this migration
 * deliberately idempotent for an interrupted development database, but never
 * leave a row nullable: missing snapshot metadata would otherwise make a
 * legacy fixture disappear from grading silently.
 */
export class StoreTemplateResourcesInSnapshots1794010000000
  implements MigrationInterface
{
  name = 'StoreTemplateResourcesInSnapshots1794010000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "template_resource" ADD COLUMN IF NOT EXISTS "snapshotId" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "template_resource" ADD COLUMN IF NOT EXISTS "digest" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "template_resource" ADD COLUMN IF NOT EXISTS "size" integer',
    );
    // Older development revisions stored bytes on the Platform API filesystem
    // and made this column mandatory. Preserve those values for backfill, but
    // permit new snapshot-only uploads to omit the legacy path.
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'template_resource'
            AND column_name = 'storagePath'
        ) THEN
          ALTER TABLE "template_resource" ALTER COLUMN "storagePath" DROP NOT NULL;
        END IF;
      END $$;
    `);
    const legacy = await queryRunner.query(
      `SELECT COUNT(*)::integer AS "count" FROM "template_resource"
       WHERE "snapshotId" IS NULL OR "digest" IS NULL OR "size" IS NULL`,
    );
    if (Number(legacy[0]?.count ?? 0) > 0) {
      throw new Error(
        'Template resources require snapshot backfill before this migration; refusing to ignore legacy fixtures.',
      );
    }
    await queryRunner.query(
      'ALTER TABLE "template_resource" ALTER COLUMN "snapshotId" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "template_resource" ALTER COLUMN "digest" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "template_resource" ALTER COLUMN "size" SET NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "template_resource" ALTER COLUMN "size" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "template_resource" ALTER COLUMN "digest" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "template_resource" ALTER COLUMN "snapshotId" DROP NOT NULL');
  }
}
