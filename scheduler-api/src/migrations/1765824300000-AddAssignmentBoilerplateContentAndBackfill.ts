import { MigrationInterface, QueryRunner } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

export class AddAssignmentBoilerplateContentAndBackfill1765824300000
  implements MigrationInterface
{
  name = 'AddAssignmentBoilerplateContentAndBackfill1765824300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "boilerplateContent" text`,
    );

    const assignments = await queryRunner.query(
      `SELECT "id", "boilerplateFilePath", "boilerplateContent" FROM "assignment" WHERE ("boilerplateContent" IS NULL OR "boilerplateContent" = '') AND "boilerplateFilePath" IS NOT NULL AND "boilerplateFilePath" <> ''`,
    );

    const assignmentsDir = path.resolve(process.cwd(), 'assignments-upload');

    for (const assignment of assignments as Array<{
      id: number;
      boilerplateFilePath: string;
      boilerplateContent: string | null;
    }>) {
      const filePath = path.isAbsolute(assignment.boilerplateFilePath)
        ? assignment.boilerplateFilePath
        : path.resolve(assignmentsDir, assignment.boilerplateFilePath);

      try {
        const content = await fs.readFile(filePath, 'utf-8');

        await queryRunner.query(
          `UPDATE "assignment" SET "boilerplateContent" = $1 WHERE "id" = $2`,
          [content, assignment.id],
        );
      } catch {
        // Keep migration resilient when legacy file is missing.
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN IF EXISTS "boilerplateContent"`,
    );
  }
}
