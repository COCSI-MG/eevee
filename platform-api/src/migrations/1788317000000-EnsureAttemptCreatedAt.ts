import { MigrationInterface, QueryRunner } from 'typeorm';

/** Kept before the index migration without rewriting already-applied history. */
export class EnsureAttemptCreatedAt1788317000000 implements MigrationInterface {
  name = 'EnsureAttemptCreatedAt1788317000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "attempt" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // The historical schema owns this column; do not remove it on rollback.
  }
}
