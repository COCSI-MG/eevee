import { MigrationInterface, QueryRunner } from 'typeorm';
export class LearningActivities1790179200000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE learning_activity (
      id SERIAL PRIMARY KEY, "classId" integer NOT NULL REFERENCES class(id) ON DELETE CASCADE,
      kind varchar(20) NOT NULL CHECK (kind IN ('practice','quiz')), title varchar(160) NOT NULL,
      description text NOT NULL, published boolean NOT NULL DEFAULT false,
      "startDate" timestamptz, "dueDate" timestamptz, "maxAttempts" integer NOT NULL DEFAULT 1 CHECK ("maxAttempts" BETWEEN 1 AND 20),
      "feedbackReleased" boolean NOT NULL DEFAULT false, practice jsonb, questions jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT now())`);
    await q.query(
      `CREATE INDEX "IDX_learning_activity_class" ON learning_activity ("classId")`,
    );
    await q.query(`CREATE TABLE learning_quiz_attempt (
      id SERIAL PRIMARY KEY, "activityId" integer NOT NULL REFERENCES learning_activity(id) ON DELETE RESTRICT,
      "userId" integer NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
      attempt integer NOT NULL, answers jsonb NOT NULL, score double precision NOT NULL CHECK (score BETWEEN 0 AND 1),
      "createdAt" timestamptz NOT NULL DEFAULT now(), UNIQUE ("activityId", "userId", attempt))`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE learning_quiz_attempt');
    await q.query('DROP TABLE learning_activity');
  }
}
