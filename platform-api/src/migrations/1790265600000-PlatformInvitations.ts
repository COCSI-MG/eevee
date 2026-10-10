import { MigrationInterface, QueryRunner } from 'typeorm';
export class PlatformInvitations1790265600000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE platform_invitation (
      id SERIAL PRIMARY KEY, email varchar(254) NOT NULL, name varchar(160) NOT NULL,
      "classIds" jsonb NOT NULL, "tokenHash" varchar(64) NOT NULL,
      "expiresAt" timestamptz NOT NULL, "acceptedAt" timestamptz, "revokedAt" timestamptz,
      "deliveryStatus" varchar(20) NOT NULL DEFAULT 'pending', "sentAt" timestamptz,
      "invitedBy" integer NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now())`);
    await q.query(
      'CREATE INDEX "IDX_invitation_created" ON platform_invitation ("createdAt", id)',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE platform_invitation');
  }
}
