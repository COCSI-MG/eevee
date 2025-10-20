import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGraphqlWorkerType1760312024991 implements MigrationInterface {
  name = 'AddGraphqlWorkerType1760312024991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."assignment_workertype_enum" ADD VALUE IF NOT EXISTS 'node_graphql'`
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
  }
}
