import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetsTable1784325645216
  implements MigrationInterface
{
  name = 'CreatePasswordResetsTable1784325645216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_resets" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" INTEGER NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_password_resets_token_hash" ON "password_resets"("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_password_resets_user_id" ON "password_resets"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_password_resets_expires_at" ON "password_resets"("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_resets"`);
  }
}
