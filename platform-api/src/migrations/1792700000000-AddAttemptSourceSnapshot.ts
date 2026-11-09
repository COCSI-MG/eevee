import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttemptSourceSnapshot1792700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "attempt" ADD "sourceSnapshotId" varchar(64)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$
      BEGIN
        LOCK TABLE "attempt" IN ACCESS EXCLUSIVE MODE;
        IF EXISTS (SELECT 1 FROM "attempt" WHERE "sourceSnapshotId" IS NOT NULL AND "receivedWork" IS NULL) THEN
          RAISE EXCEPTION 'Cannot remove source references for snapshot-only attempts';
        END IF;
        ALTER TABLE "attempt" DROP COLUMN "sourceSnapshotId";
      END $$`);
  }
}
