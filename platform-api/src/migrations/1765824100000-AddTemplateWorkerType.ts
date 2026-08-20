import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateWorkerType1765824100000 implements MigrationInterface {
  name = 'AddTemplateWorkerType1765824100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."template_workertype_enum" AS ENUM('node_default', 'node_nestjs', 'node_grpcjs', 'node_react')`,
    );

    await queryRunner.query(
      `ALTER TABLE "template" ADD "workerType" "public"."template_workertype_enum" NOT NULL DEFAULT 'node_default'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "workerType"`);
    await queryRunner.query(`DROP TYPE "public"."template_workertype_enum"`);
  }
}
