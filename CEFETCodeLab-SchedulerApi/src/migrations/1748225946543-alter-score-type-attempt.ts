import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterScoreTypeAttempt1748225946543 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attempt"
      ALTER COLUMN "score"
      TYPE double precision
      USING score::double precision
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attempt"
      ALTER COLUMN "score"
      TYPE integer
      USING score::integer
    `);
  }
}
