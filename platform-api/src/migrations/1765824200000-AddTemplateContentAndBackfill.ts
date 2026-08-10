import { MigrationInterface, QueryRunner } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';

export class AddTemplateContentAndBackfill1765824200000
  implements MigrationInterface
{
  name = 'AddTemplateContentAndBackfill1765824200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD COLUMN IF NOT EXISTS "content" text`,
    );

    const templates = await queryRunner.query(
      `SELECT "id", "filePath", "content" FROM "template" WHERE ("content" IS NULL OR "content" = '') AND "filePath" IS NOT NULL AND "filePath" <> ''`,
    );

    const templatesDir = path.resolve(process.cwd(), 'templates-upload');

    for (const template of templates as Array<{
      id: number;
      filePath: string;
      content: string | null;
    }>) {
      const filePath = path.resolve(templatesDir, template.filePath);

      try {
        const content = await fs.readFile(filePath, 'utf-8');

        await queryRunner.query(
          `UPDATE "template" SET "content" = $1 WHERE "id" = $2`,
          [content, template.id],
        );
      } catch {
        // Keep migration resilient when legacy file is missing.
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN IF EXISTS "content"`,
    );
  }
}
