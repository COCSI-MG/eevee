import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignmentDependencies1794500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE
        "assignment"
      ADD COLUMN
        "dependencies" text
      NOT NULL DEFAULT ''
    `);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE
        "assignment"
      DROP COLUMN
        "dependencies"
    `);
  }
}
