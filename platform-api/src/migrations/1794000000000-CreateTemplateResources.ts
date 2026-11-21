import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateResources1794000000000 implements MigrationInterface {
  name = 'CreateTemplateResources1794000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "template_resource" (
        "id" SERIAL NOT NULL,
        "templateId" integer NOT NULL,
        "fileName" character varying NOT NULL,
        "snapshotId" character varying NOT NULL,
        "digest" character varying NOT NULL,
        "size" integer NOT NULL,
        CONSTRAINT "PK_template_resource" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_resource_template_file" UNIQUE ("templateId", "fileName"),
        CONSTRAINT "CK_template_resource_size_non_negative" CHECK ("size" >= 0),
        CONSTRAINT "FK_template_resource_template" FOREIGN KEY ("templateId")
          REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "template_resource"');
  }
}
