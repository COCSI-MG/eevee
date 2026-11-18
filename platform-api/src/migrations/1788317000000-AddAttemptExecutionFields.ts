import { MigrationInterface, QueryRunner } from 'typeorm';

// These entity fields predate the attempt indexes, but were never migrated.
export class AddAttemptExecutionFields1788317000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."attempt_status_enum" AS ENUM
        ('pending', 'running', 'completed', 'enqueded', 'failed');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`);
    await queryRunner.query(`ALTER TABLE "attempt"
      ADD COLUMN IF NOT EXISTS "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "receivedWork" jsonb,
      ADD COLUMN IF NOT EXISTS "status" "public"."attempt_status_enum"`);
    // Historical attempts were stored after execution, so preserve their meaning.
    await queryRunner.query(
      `UPDATE "attempt" SET "status" = 'completed' WHERE "status" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "attempt"
      ALTER COLUMN "status" SET DEFAULT 'pending',
      ALTER COLUMN "status" SET NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "attempt"
      DROP COLUMN "status", DROP COLUMN "receivedWork", DROP COLUMN "createdAt"`);
    await queryRunner.query(`DROP TYPE "public"."attempt_status_enum"`);
  }
}
