import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNodeTeraormWorkerType1774200000000
  implements MigrationInterface
{
  name = 'AddNodeTeraormWorkerType1774200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."assignment_workertype_enum" ADD VALUE IF NOT EXISTS 'node_teraorm'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."template_workertype_enum" ADD VALUE IF NOT EXISTS 'node_teraorm'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing enum values without rebuilding the type.
    // Down-migration intentionally left as a no-op.
  }
}
