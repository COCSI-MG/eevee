import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJavascriptDefaultWorkerType1787100000000
  implements MigrationInterface
{
  name = 'AddJavascriptDefaultWorkerType1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."assignment_workertype_enum" ADD VALUE IF NOT EXISTS 'javascript_default'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."template_workertype_enum" ADD VALUE IF NOT EXISTS 'javascript_default'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL cannot remove enum values without rebuilding the type.
    // Keep the down migration intentionally non-destructive.
  }
}
