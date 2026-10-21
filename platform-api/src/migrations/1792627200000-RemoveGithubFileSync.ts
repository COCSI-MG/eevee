import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGithubFileSync1792627200000 implements MigrationInterface {
  name = 'RemoveGithubFileSync1792627200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sync_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "file_entries"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sync_jobs_jobtype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."sync_jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."file_entries_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE 
        "public"."file_entries_status_enum" 
      AS ENUM 
        ('local_pending', 'syncing', 'synced', 'error')`
    );
    await queryRunner.query(
      `
        CREATE TYPE 
          "public"."sync_jobs_jobtype_enum" 
        AS ENUM 
          ('upload', 'download', 'delete', 'sync')
      `
    );
    await queryRunner.query(
      `
        CREATE TYPE 
          "public"."sync_jobs_status_enum"
        AS ENUM 
          ('pending', 'processing', 'completed', 'failed', 'retrying')
      `
    );

    await queryRunner.query(`
      CREATE TABLE "file_entries" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "assignmentId" integer NOT NULL,
        "userId" integer NOT NULL,
        "filePath" character varying NOT NULL,
        "localTempPath" character varying,
        "fileSize" bigint NOT NULL,
        "mimeType" character varying NOT NULL,
        "status" "public"."file_entries_status_enum" NOT NULL DEFAULT 'local_pending',
        "syncAttempts" integer NOT NULL DEFAULT 0,
        "lastSyncAttempt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_file_entries_assignment" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_file_entries_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);
    
    await queryRunner.query(`
      CREATE TABLE "sync_jobs" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "fileEntryId" integer NOT NULL,
        "jobType" "public"."sync_jobs_jobtype_enum" NOT NULL,
        "priority" integer NOT NULL DEFAULT 0,
        "status" "public"."sync_jobs_status_enum" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "maxAttempts" integer NOT NULL DEFAULT 3,
        "errorMessage" text,
        "scheduledAt" TIMESTAMP NOT NULL,
        "startedAt" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sync_jobs_file_entry" FOREIGN KEY ("fileEntryId") REFERENCES "file_entries"("id") ON DELETE CASCADE
      )
    `);
  }
}
