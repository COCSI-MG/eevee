import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnswerKey1781000000000 implements MigrationInterface {
  name = 'CreateAnswerKey1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "answer_key" (
        "id" SERIAL NOT NULL,
        "assignmentId" integer NOT NULL,
        "content" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_answer_key_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_answer_key_assignment" UNIQUE ("assignmentId")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "answer_key" ADD CONSTRAINT "FK_answer_key_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "answer_key" DROP CONSTRAINT "FK_answer_key_assignment"`,
    );
    await queryRunner.query(`DROP TABLE "answer_key"`);
  }
}
