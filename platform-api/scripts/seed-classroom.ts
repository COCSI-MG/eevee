import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { QueryRunner } from 'typeorm';
import { AppDataSource } from '../data-source';
import { LearningActivityDto } from '../src/learning-activity/learning-activity.dto';
import { validateActivity } from '../src/learning-activity/learning-activity.policy';
import { activitiesFor, classroomCatalog } from './classroom/catalog';

export function validateCatalog() {
  for (const group of classroomCatalog) {
    for (const item of activitiesFor(group.topic)) {
      const dto = plainToInstance(LearningActivityDto, { ...item, classId: 1 });
      if (validateSync(dto).length)
        throw new Error(`Invalid seed activity: ${item.title}`);
      validateActivity(dto);
    }
  }
}

// Natural keys: exact class name, then (classId, activity title).
// Existing rows are never overwritten: teacher edits, publishing and attempts survive reruns.
export async function seedClassroom(runner: QueryRunner, preview = true) {
  validateCatalog();
  const result: { class: string; action: string; activity?: string }[] = [];
  for (const group of classroomCatalog) {
    const matches = await runner.query('SELECT id FROM "class" WHERE name=$1', [
      group.name,
    ]);
    if (matches.length > 1)
      throw new Error(`Ambiguous class name: ${group.name}`);
    let classId: number | undefined = matches[0]?.id;
    result.push({
      class: group.name,
      action: classId ? 'reuse class' : 'create class',
    });
    if (!classId && !preview) {
      const rows = await runner.query(
        'INSERT INTO "class" (name,description) VALUES ($1,$2) RETURNING id',
        [
          group.name,
          `Atividades baseadas no material fornecido para ${group.name}. Laboratório guiado e questionário para revisão do professor.`,
        ],
      );
      classId = rows[0].id;
    }
    for (const activity of activitiesFor(group.topic)) {
      const existing = classId
        ? await runner.query(
            'SELECT id,kind FROM learning_activity WHERE "classId"=$1 AND title=$2',
            [classId, activity.title],
          )
        : [];
      if (
        existing.length > 1 ||
        (existing.length === 1 && existing[0].kind !== activity.kind)
      )
        throw new Error(
          `Ambiguous activity: ${group.name} / ${activity.title}`,
        );
      result.push({
        class: group.name,
        activity: activity.title,
        action: existing.length
          ? 'keep existing activity'
          : 'create draft activity',
      });
      if (!existing.length && !preview) {
        await runner.query(
          `INSERT INTO learning_activity ("classId",kind,title,description,published,"startDate","dueDate","maxAttempts","feedbackReleased",practice,questions)
          VALUES ($1,$2,$3,$4,false,NULL,NULL,$5,false,$6::jsonb,$7::jsonb)`,
          [
            classId,
            activity.kind,
            activity.title,
            activity.description,
            activity.maxAttempts,
            activity.practice ? JSON.stringify(activity.practice) : null,
            activity.questions ? JSON.stringify(activity.questions) : null,
          ],
        );
      }
    }
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  if (
    args.some((arg) => !['--preview', '--apply'].includes(arg)) ||
    args.length > 1
  )
    throw new Error('Use --preview or --apply.');
  const preview = !args.includes('--apply');
  await AppDataSource.initialize();
  const runner = AppDataSource.createQueryRunner();
  try {
    if (await AppDataSource.showMigrations())
      throw new Error('Pending migrations. Run make migration-run first.');
    await runner.startTransaction('SERIALIZABLE');
    if (preview) await runner.query('SET TRANSACTION READ ONLY');
    else
      await runner.query(
        "SELECT pg_advisory_xact_lock(hashtext('eevee:neemias-classroom-seed'))",
      );
    const result = await seedClassroom(runner, preview);
    if (preview) await runner.rollbackTransaction();
    else await runner.commitTransaction();
    console.table(result);
    console.log(
      preview
        ? 'Preview only: no records changed.'
        : 'Classroom seed complete. New activities are drafts.',
    );
    console.log('No users, invitations, enrollments or quiz attempts created.');
  } catch (error) {
    if (runner.isTransactionActive) await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
    await AppDataSource.destroy();
  }
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
