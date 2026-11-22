import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentAuthorAndTemplateParamType1789099000000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assignment"
      ADD COLUMN IF NOT EXISTS "createdById" integer REFERENCES "user"("id"),
      ADD COLUMN IF NOT EXISTS "initSqlScript" text,
      ADD COLUMN IF NOT EXISTS "boilerplateFilePath" varchar`);
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."template_param_type_enum" AS ENUM ('OBJECT', 'STRING', 'NUMBER', 'BOOLEAN');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$`);
    await queryRunner.query(`ALTER TABLE "template_param"
      ADD COLUMN IF NOT EXISTS "type" "public"."template_param_type_enum" NOT NULL DEFAULT 'STRING'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template_param" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."template_param_type_enum"`);
    await queryRunner.query(`ALTER TABLE "assignment"
      DROP COLUMN "boilerplateFilePath", DROP COLUMN "initSqlScript", DROP COLUMN "createdById"`);
  }
}
