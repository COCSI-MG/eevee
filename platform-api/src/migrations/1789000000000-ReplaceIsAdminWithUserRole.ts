import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceIsAdminWithUserRole1789000000000
  implements MigrationInterface
{
  name = 'ReplaceIsAdminWithUserRole1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('aluno', 'professor', 'admin')`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "role" "public"."user_role_enum"`
    );
    await queryRunner.query(
      `UPDATE
        "user"
      SET "role" = CASE WHEN "isAdmin"
      THEN
        'admin'::"public"."user_role_enum"
      ELSE
        'aluno'::"public"."user_role_enum" END`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'aluno'`
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isAdmin"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "isAdmin" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `UPDATE "user" SET "isAdmin" = ("role" = 'admin')`
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
