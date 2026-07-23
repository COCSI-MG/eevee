import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamAndExamAssignment1774600000000
  implements MigrationInterface
{
  name = 'AddExamAndExamAssignment1774600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exam" (
        "id" SERIAL NOT NULL,
        "title" character varying(100) NOT NULL,
        "description" character varying(255),
        "classId" integer,
        "dueDate" TIMESTAMP,
        "startDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "exam_assignment" (
        "id" SERIAL NOT NULL,
        "examId" integer NOT NULL,
        "assignmentId" integer NOT NULL,
        CONSTRAINT "PK_exam_assignment_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_exam_assignment_assignmentId" ON "exam_assignment" ("assignmentId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "exam" ADD CONSTRAINT "FK_exam_class" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_assignment" ADD CONSTRAINT "FK_exam_assignment_exam" FOREIGN KEY ("examId") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_assignment" ADD CONSTRAINT "FK_exam_assignment_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "exam_assignment" DROP CONSTRAINT "FK_exam_assignment_assignment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_assignment" DROP CONSTRAINT "FK_exam_assignment_exam"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam" DROP CONSTRAINT "FK_exam_class"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."UQ_exam_assignment_assignmentId"`,
    );
    await queryRunner.query(`DROP TABLE "exam_assignment"`);
    await queryRunner.query(`DROP TABLE "exam"`);
  }
}
