import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserExternalIdentity1787279000000 implements MigrationInterface {
  name = 'UserExternalIdentity1787279000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "externalSubject" VARCHAR(255)`);
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "identityProvider" VARCHAR(64)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_identity_active" ON "user" ("identityProvider", "externalSubject") WHERE "deletedAt" IS NULL AND "externalSubject" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_user_identity_active"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "identityProvider"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "externalSubject"`);
  }
}
