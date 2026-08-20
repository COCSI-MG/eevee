import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPythonDefaultWorkerType1780000000000
  implements MigrationInterface
{
  name = 'AddPythonDefaultWorkerType1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."assignment_workertype_enum" ADD VALUE IF NOT EXISTS 'python_default'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."template_workertype_enum" ADD VALUE IF NOT EXISTS 'python_default'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Postgres não suporta remover enums
  }
}
