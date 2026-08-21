import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnswerKeyToAssignment1781000000001
  implements MigrationInterface
{
  name = 'AddAnswerKeyToAssignment1781000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD COLUMN "answerKeyId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD COLUMN "answerKeyVisible" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD CONSTRAINT "FK_assignment_answer_key" FOREIGN KEY ("answerKeyId") REFERENCES "answer_key"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP CONSTRAINT "FK_assignment_answer_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "answerKeyVisible"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "answerKeyId"`,
    );
  }
}
