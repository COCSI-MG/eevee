import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClassInvitations1791830400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "class_invitation" (
        "id" SERIAL PRIMARY KEY,
        "classId" integer NOT NULL REFERENCES "class"("id") ON DELETE CASCADE,
        "tokenHash" varchar(64) NOT NULL UNIQUE,
        "expiresAt" timestamptz NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "IDX_class_invitation_class_id" ON "class_invitation" ("classId")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "class_invitation"');
  }
}
