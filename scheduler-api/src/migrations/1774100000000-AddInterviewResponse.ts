import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterviewResponse1774100000000 implements MigrationInterface {
  name = 'AddInterviewResponse1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."interview_response_easiertounderstand_enum" AS ENUM('sdk', 'teraorm', 'no_difference', 'no_preference')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_response_easiertomodify_enum" AS ENUM('sdk', 'teraorm', 'no_difference', 'no_preference')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_response_futurepreference_enum" AS ENUM('sdk', 'teraorm', 'no_difference', 'no_preference')`,
    );

    await queryRunner.query(`
      CREATE TABLE "interview_response" (
        "id" SERIAL NOT NULL,
        "assignmentId" integer NOT NULL,
        "userId" integer NOT NULL,
        "attemptId" integer,
        "familiaritySql" integer NOT NULL,
        "familiarityJsTs" integer NOT NULL,
        "familiarityOrms" integer NOT NULL,
        "sdkClarity" integer NOT NULL,
        "sdkModifiability" integer NOT NULL,
        "sdkSqlErrorProneness" integer NOT NULL,
        "ormClarity" integer NOT NULL,
        "ormModifiability" integer NOT NULL,
        "ormIntent" integer NOT NULL,
        "ormMentalEffort" integer NOT NULL,
        "ormSafety" integer NOT NULL,
        "easierToUnderstand" "public"."interview_response_easiertounderstand_enum" NOT NULL,
        "easierToModify" "public"."interview_response_easiertomodify_enum" NOT NULL,
        "futurePreference" "public"."interview_response_futurepreference_enum" NOT NULL,
        "teraormMainAdvantage" text,
        "teraormMainDifficulty" text,
        "additionalNotes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interview_response_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_interview_response_user_assignment" ON "interview_response" ("userId", "assignmentId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "interview_response" ADD CONSTRAINT "FK_interview_response_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_response" ADD CONSTRAINT "FK_interview_response_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_response" ADD CONSTRAINT "FK_interview_response_attempt" FOREIGN KEY ("attemptId") REFERENCES "attempt"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "interview_response" DROP CONSTRAINT "FK_interview_response_attempt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_response" DROP CONSTRAINT "FK_interview_response_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_response" DROP CONSTRAINT "FK_interview_response_assignment"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_interview_response_user_assignment"`,
    );
    await queryRunner.query(`DROP TABLE "interview_response"`);

    await queryRunner.query(
      `DROP TYPE "public"."interview_response_futurepreference_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."interview_response_easiertomodify_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."interview_response_easiertounderstand_enum"`,
    );
  }
}
