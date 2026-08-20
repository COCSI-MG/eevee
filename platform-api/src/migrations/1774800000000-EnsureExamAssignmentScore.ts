import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureExamAssignmentScore1774800000000
  implements MigrationInterface
{
  name = 'EnsureExamAssignmentScore1774800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_assignment' AND column_name = 'score'
    `);

    if (columnExists.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "exam_assignment" ADD COLUMN "score" decimal(5,2) NULL`,
      );
    }

    const isNullable = await queryRunner.query(`
      SELECT is_nullable FROM information_schema.columns
      WHERE table_name = 'exam_assignment' AND column_name = 'score'
    `);

    if (isNullable.length > 0 && isNullable[0].is_nullable === 'YES') {
      await queryRunner.query(
        `UPDATE "exam_assignment" SET "score" = 1.00 WHERE "score" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "exam_assignment" ALTER COLUMN "score" SET NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'exam_assignment' AND column_name = 'score'
    `);

    if (columnExists.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "exam_assignment" ALTER COLUMN "score" DROP NOT NULL`,
      );
    }
  }
}
