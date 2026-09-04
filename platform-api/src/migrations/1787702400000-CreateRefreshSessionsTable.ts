import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshSessionsTable1787702400000
  implements MigrationInterface
{
  name = 'CreateRefreshSessionsTable1787702400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_sessions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "family_id" UUID NOT NULL,
        "token_hash" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "expires_at" TIMESTAMP NOT NULL,
        "revoked_at" TIMESTAMP NULL,
        "replaced_by" UUID NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_refresh_sessions_token_hash" ON "refresh_sessions"("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_family_id" ON "refresh_sessions"("family_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_user_id" ON "refresh_sessions"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_refresh_sessions_expires_at" ON "refresh_sessions"("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_sessions"`);
  }
}
