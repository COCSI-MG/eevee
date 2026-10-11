import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssignmentAlerts1788739200000 implements MigrationInterface {
  name = 'CreateAssignmentAlerts1788739200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "suspensionAlertLimit" integer NOT NULL DEFAULT 5`);

    await queryRunner.query(`ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "typingCharactersPerSecondLimit" integer NOT NULL DEFAULT 20`);

    await queryRunner.query(`ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "alertPolicyVersion" integer NOT NULL DEFAULT 1`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."assignment_alert_type_enum" AS ENUM(
          'window_focus_loss',
          'devtools',
          'clipboard',
          'typing_rate',
          'legacy_suspension'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assignment_alert_rule" (
        "id" SERIAL NOT NULL,
        "assignmentId" integer NOT NULL,
        "type" "public"."assignment_alert_type_enum" NOT NULL,
        CONSTRAINT "PK_assignment_alert_rule" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assignment_alert_rule_assignment_type" UNIQUE ("assignmentId", "type"),
        CONSTRAINT "FK_assignment_alert_rule_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assignment_user_alert" (
        "id" SERIAL NOT NULL,
        "eventId" uuid NOT NULL,
        "assignmentId" integer NOT NULL,
        "userId" integer NOT NULL,
        "type" "public"."assignment_alert_type_enum" NOT NULL,
        "details" jsonb,
        "occurredAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "archivedByUserId" integer,
        CONSTRAINT "PK_assignment_user_alert" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assignment_user_alert_event" UNIQUE ("eventId"),
        CONSTRAINT "FK_assignment_user_alert_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_assignment_user_alert_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_assignment_user_alert_archived_by" FOREIGN KEY ("archivedByUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assignment_user_alert_active" ON "assignment_user_alert" ("assignmentId", "userId", "deletedAt")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF to_regclass('public.assignment_user_suspension') IS NOT NULL THEN
          INSERT INTO "assignment_user_alert" (
            "eventId", "assignmentId", "userId", "type", "details",
            "occurredAt", "createdAt", "deletedAt"
          )
          SELECT
            ('00000000-0000-4000-8000-' || lpad("id"::text, 12, '0'))::uuid,
            "assignmentId",
            "userId",
            'legacy_suspension'::"public"."assignment_alert_type_enum",
            jsonb_build_object('legacyReason', "reason"),
            "createdAt",
            "createdAt",
            now()
          FROM "assignment_user_suspension"
          ON CONFLICT ("eventId") DO NOTHING;

          DROP TABLE "assignment_user_suspension";
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assignment_user_suspension" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "assignmentId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "reason" character varying(255),
        CONSTRAINT "PK_assignment_user_suspension" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assignment_user_suspension_user_assignment" UNIQUE ("assignmentId", "userId"),
        CONSTRAINT "FK_assignment_user_suspension_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_assignment_user_suspension_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "assignment_user_suspension" ("userId", "assignmentId", "createdAt", "reason")
      SELECT
        alert."userId",
        alert."assignmentId",
        MAX(alert."createdAt"),
        'Bloqueio restaurado a partir dos alertas ativos'
      FROM "assignment_user_alert" alert
      INNER JOIN "assignment" assignment
        ON assignment."id" = alert."assignmentId"
      WHERE alert."deletedAt" IS NULL
      GROUP BY alert."userId", alert."assignmentId"
      HAVING COUNT(alert."id") >= MAX(assignment."suspensionAlertLimit")
      ON CONFLICT ("assignmentId", "userId") DO NOTHING
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "assignment_user_alert"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assignment_alert_rule"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."assignment_alert_type_enum"`);
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN IF EXISTS "alertPolicyVersion"`);
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN IF EXISTS "typingCharactersPerSecondLimit"`);
    await queryRunner.query(`ALTER TABLE "assignment" DROP COLUMN IF EXISTS "suspensionAlertLimit"`);
  }
}
