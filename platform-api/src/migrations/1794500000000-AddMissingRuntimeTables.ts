import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingRuntimeTables1794500000000
  implements MigrationInterface
{
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "CREATE TYPE \"public\".\"scheduling_preview_runs_status_enum\" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled')",
    );
    await q.query(
      'CREATE TABLE "scheduling_preview_runs" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "assignmentId" integer NOT NULL, "status" "public"."scheduling_preview_runs_status_enum" NOT NULL DEFAULT \'pending\', "jobName" character varying, "isAcceptable" boolean, "score" double precision, "passes" integer, "fails" integer, "report" text DEFAULT \'\', "errorMessage" text, "completedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ef3d8fda1b34127387f7bf76344" PRIMARY KEY ("id"))',
    );
    await q.query(
      'ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "description" varchar',
    );
    await q.query(
      'ALTER TABLE "user_class" ADD COLUMN IF NOT EXISTS "id" SERIAL NOT NULL',
    );
    await q.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_class_id" ON "user_class" ("id")',
    );
    await q.query(
      'ALTER TABLE "template" ALTER COLUMN "filePath" DROP NOT NULL',
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE "template" ALTER COLUMN "filePath" SET NOT NULL',
    );
    await q.query('DROP INDEX "IDX_user_class_id"');
    await q.query('ALTER TABLE "user_class" DROP COLUMN "id"');
    await q.query('ALTER TABLE "class" DROP COLUMN "description"');
    await q.query('DROP TABLE "scheduling_preview_runs"');
    await q.query('DROP TYPE "public"."scheduling_preview_runs_status_enum"');
  }
}
