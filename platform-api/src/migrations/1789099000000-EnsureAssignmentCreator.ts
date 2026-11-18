import { MigrationInterface, QueryRunner } from 'typeorm';

/** Kept before class/template scoping without rewriting applied history. */
export class EnsureAssignmentCreator1789099000000 implements MigrationInterface {
  name = 'EnsureAssignmentCreator1789099000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "createdById" integer',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // The historical schema owns this column; do not remove it on rollback.
  }
}
