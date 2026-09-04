import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowCopyPasteToAssignment1787829302759
  implements MigrationInterface
{
  name = 'AddAllowCopyPasteToAssignment1787829302759';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD COLUMN "allowCopyPaste" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "allowCopyPaste"`,
    );
  }
}
