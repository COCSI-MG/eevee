import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentDates1787280000000 implements MigrationInterface {
  name = 'AddAssignmentDates1787280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD "startDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD "dueDate" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "dueDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "startDate"`,
    );
  }
}
