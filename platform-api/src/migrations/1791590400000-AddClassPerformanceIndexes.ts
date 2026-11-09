import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassPerformanceIndexes1791590400000 implements MigrationInterface {
  name = 'AddClassPerformanceIndexes1791590400000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX
        "IDX_user_class_class_user"
      ON
        "user_class" (
          "classId",
          "userId"
        )`
    );
    await queryRunner.query(
      `CREATE INDEX
        "IDX_attempt_completed_assignment_user_latest"
      ON
        "attempt" (
          "userId",
          "assignmentId",
          "createdAt" DESC,
          "id" DESC
        )`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_attempt_completed_assignment_user_latest"`)

    await queryRunner.query(`DROP INDEX "IDX_user_class_class_user"`)
  }
}
