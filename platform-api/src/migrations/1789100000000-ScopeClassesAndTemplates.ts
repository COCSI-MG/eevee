import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeClassesAndTemplates1789100000000 implements MigrationInterface {
  name = 'ScopeClassesAndTemplates1789100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "class" ADD "teacherId" integer`);
    await queryRunner.query(`ALTER TABLE "class" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`
      UPDATE
        "class" c
      SET
        "teacherId" = inferred."teacherId"
      FROM (
        SELECT
          a."classId", MIN(a."createdById") AS "teacherId"
        FROM
          "assignment" a
        INNER JOIN
          "user" u
        ON u.id = a."createdById" AND u.role = 'professor'
        WHERE
          a."createdById" IS NOT NULL
        GROUP BY
          a."classId"
        HAVING
          COUNT(DISTINCT a."createdById") = 1
      ) inferred
      WHERE
        inferred."classId" = c.id
    `);
    await queryRunner.query(`
      ALTER TABLE
        "class"
      ADD CONSTRAINT
        "FK_class_teacher"
      FOREIGN KEY ("teacherId")
      REFERENCES
        "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "template" ADD "classId" integer`);
    await queryRunner.query(`
      CREATE TEMP TABLE "template_class_map" (
        "sourceTemplateId" integer NOT NULL,
        "classId" integer NOT NULL,
        "scopedTemplateId" integer NOT NULL,
        PRIMARY KEY ("sourceTemplateId", "classId")
      ) ON COMMIT DROP
    `);
    await queryRunner.query(`
      CREATE TEMP TABLE "template_param_class_map" (
        "sourceParamId" integer NOT NULL,
        "classId" integer NOT NULL,
        "scopedParamId" integer NOT NULL,
        PRIMARY KEY ("sourceParamId", "classId")
      ) ON COMMIT DROP
    `);
    await queryRunner.query(`
      DO $$
      DECLARE t record; c record; p record; new_template_id integer;
      BEGIN
        FOR t IN
          SELECT
            DISTINCT template."id" AS "templateId"
          FROM
            "template" template
          INNER JOIN
            "assignment_template" at ON at."templateId" = template."id"
          ORDER BY
            template."id"
        LOOP
          FOR c IN
            SELECT
              DISTINCT a."classId"
            FROM
              "assignment_template" at
            INNER JOIN
              "assignment" a ON a."id" = at."assignmentId"
            WHERE
              at."templateId" = t."templateId"
            ORDER BY
              a."classId"
          LOOP
            IF NOT EXISTS (
              SELECT
                1
              FROM
                "template_class_map"
              WHERE "sourceTemplateId" = t."templateId"
            ) THEN
              new_template_id := t."templateId";
              UPDATE
                "template"
              SET
                "classId" = c."classId"
              WHERE
                "id" = t."templateId";
            ELSE
              INSERT INTO
                "template" ("title", "description", "filePath", "content", "workerType", "dependencies", "classId")
              SELECT
                "title", "description", "filePath", "content", "workerType", "dependencies", c."classId"
              FROM
                "template" WHERE "id" = t."templateId"
              RETURNING
                "id"
              INTO
                new_template_id;

              FOR p IN
                SELECT
                  "id", "name"
                FROM
                  "template_param"
                WHERE
                  "templateId" = t."templateId"
                ORDER BY
                  "id"
              LOOP
                INSERT INTO "template_param" ("name", "templateId")
                VALUES (p."name", new_template_id);
              END LOOP;
            END IF;

            INSERT INTO
              "template_class_map" ("sourceTemplateId", "classId", "scopedTemplateId")
            VALUES
              (t."templateId", c."classId", new_template_id);

            INSERT INTO
              "template_param_class_map" ("sourceParamId", "classId", "scopedParamId")
            SELECT
              original."id", c."classId", scoped."id"
            FROM
              "template_param" original
            INNER JOIN
              "template_param" scoped
            ON
              scoped."templateId" = new_template_id AND scoped."name" = original."name"
            WHERE
              original."templateId" = t."templateId"
            ON CONFLICT DO NOTHING;
          END LOOP;
        END LOOP;
      END $$
    `);
    await queryRunner.query(`
      UPDATE
        "assignment_template" at
      SET
        "templateId" = mapping."scopedTemplateId"
      FROM
        "assignment" a, "template_class_map" mapping
      WHERE
        a."id" = at."assignmentId" AND
        mapping."sourceTemplateId" = at."templateId" AND
        mapping."classId" = a."classId"
    `);
    await queryRunner.query(`
      UPDATE
        "assignment_param" ap
      SET
        "templateParamsId" = mapping."scopedParamId"
      FROM
        "assignment" a, "template_param_class_map" mapping
      WHERE
        a."id" = ap."assignmentId" AND
        mapping."sourceParamId" = ap."templateParamsId" AND
        mapping."classId" = a."classId"
    `);
    await queryRunner.query(`
      ALTER TABLE
        "template"
      ADD CONSTRAINT "FK_template_class" FOREIGN KEY ("classId")
      REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`CREATE INDEX "IDX_class_teacherId" ON "class" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX "IDX_template_classId" ON "template" ("classId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_template_classId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_class_teacherId"`);
    await queryRunner.query(`ALTER TABLE "template" DROP CONSTRAINT IF EXISTS "FK_template_class"`);
    await queryRunner.query(`ALTER TABLE "class" DROP CONSTRAINT IF EXISTS "FK_class_teacher"`);
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN IF EXISTS "classId"`);
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN IF EXISTS "teacherId"`);
  }
}
