import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssignmentExecutionMode1787280000000 implements MigrationInterface {
  name = 'AssignmentExecutionMode1787280000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."assignment_executionmode_enum" AS ENUM('graded', 'adhoc'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await queryRunner.query(`ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "executionMode" "public"."assignment_executionmode_enum" NOT NULL DEFAULT 'graded'`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN IF EXISTS "executionMode"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."assignment_executionmode_enum"`);
  }
}
