import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowProjectImport1788300000000 implements MigrationInterface {
  name = 'AddAllowProjectImport1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD COLUMN "allowProjectImport" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "allowProjectImport"`,
    );
  }
}
