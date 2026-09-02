import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttemptFilterIndexes1788318000000
  implements MigrationInterface
{
  name = 'AddAttemptFilterIndexes1788318000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assignment_class_title_id" ON "assignment" ("classId", "title", "id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_attempt_assignment_created_at_id" ON "attempt" ("assignmentId", "createdAt", "id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_attempt_assignment_created_at_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_assignment_class_title_id"`,
    );
  }
}
