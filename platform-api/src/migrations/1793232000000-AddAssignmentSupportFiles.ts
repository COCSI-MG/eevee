import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentSupportFiles1793232000000 implements MigrationInterface {
  name = 'AddAssignmentSupportFiles1793232000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD "supportFiles" jsonb`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN "supportFiles"`
    );
  }
}
