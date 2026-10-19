import { DataSource } from 'typeorm';
import { AssignmentService } from './assignment.service';
import { Assignment } from './entities/assignment.entity';
import { AssignmentTemplate } from './entities/assignment-template.entity';
import { AssignmentParam } from './entities/assignment-param.entity';
import { Attempt } from '../attempt/entities/attempt.entity';
import { Template } from '../template/entities/template.entity';
import { TemplateParam } from '../template/entities/template-param.entity';
import { Class } from '../class/entities/class.entity';
import { UserClass } from '../user-class/entities/user-class.entity';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../user/user-role';
import { WorkerType } from '../worker/enum/worker-type.enum';
import { AttemptStatus } from '../attempt/enums/attempt-status.enum';
import { AssignmentUserAlert } from '../assignment-alert/entities/assignment-user-alert.entity';
import { AssignmentAlertType } from '../assignment-alert/enums/assignment-alert-type.enum';
import { TemplateService } from '../template/template.service';
import { UserService } from '../user/user.service';
import { RefreshSession } from '../auth/entities/refresh-session.entity';
import { randomUUID } from 'node:crypto';

// Explicit opt-in: no application .env, existing database or production access.
// Run with Jest --testRegex assignment-loading.integration-spec.ts (see harness).
const target = new URL(process.env.EEVEE_TEST_DATABASE_URL || 'http://missing');
if (!['postgres:', 'postgresql:'].includes(target.protocol) ||
    !['localhost', '127.0.0.1'].includes(target.hostname) ||
    target.pathname !== '/eevee_harness' || target.search || target.hash) {
  throw new Error('Use EEVEE_TEST_DATABASE_URL for a disposable local eevee_harness database');
}

describe('assignment relation loading against PostgreSQL', () => {
  const schema = `harness_${process.pid}_${Date.now()}`;
  const source = new DataSource({
    type: 'postgres', url: target.href, schema,
    entities: [__dirname + '/../**/*.entity.ts'],
  });
  let service: AssignmentService;
  let currentUser: { userId: number; role: UserRole };
  let assignments: Assignment[];
  let students: User[];
  let teacher: User;

  beforeAll(async () => {
    await source.initialize();
    await source.query(`CREATE SCHEMA "${schema}"`);
    await source.synchronize();
    const users = source.getRepository(User);
    teacher = await users.save({ email: 'teacher@harness.invalid', name: 'Teacher', passwordHash: 'synthetic', role: UserRole.TEACHER });
    const otherTeacher = await users.save({ email: 'other@harness.invalid', name: 'Other', passwordHash: 'synthetic', role: UserRole.TEACHER });
    students = await users.save(Array.from({ length: 62 }, (_, n) => ({ email: `student${n}@harness.invalid`, name: `Student ${n}`, passwordHash: 'synthetic', role: UserRole.STUDENT })));
    const classes = await source.getRepository(Class).save([
      { name: 'Large class', teacherId: teacher.id },
      { name: 'Other class', teacherId: otherTeacher.id },
    ]);
    await source.getRepository(UserClass).save(students.map(user => ({ userId: user.id, classId: classes[0].id })));
    assignments = await source.getRepository(Assignment).save([
      { classId: classes[0].id, title: 'First', description: 'Synthetic', maxAttempts: 100, workerType: WorkerType.NODE_DEFAULT, boilerplateContent: 'test boilerplate' },
      { classId: classes[0].id, title: 'Second', description: 'Synthetic', maxAttempts: 100, workerType: WorkerType.NODE_DEFAULT },
      { classId: classes[1].id, title: 'Other', description: 'Synthetic', maxAttempts: 100, workerType: WorkerType.NODE_DEFAULT },
    ]);
    await source.getRepository(Attempt).save(assignments.slice(0, 2).flatMap(assignment => Array.from({ length: 81 }, (_, n) => ({
      assignmentId: assignment.id, userId: students[n % students.length].id,
      attempt: n + 1, isAcceptable: true, score: 1, passes: 1, fails: 0,
      receivedWork: { code: 'x'.repeat(1024) }, report: 'synthetic report',
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, n)),
    }))));
    service = new AssignmentService(
      source.getRepository(Assignment), source.getRepository(AssignmentTemplate),
      source.getRepository(AssignmentParam), source.getRepository(Template),
      source.getRepository(TemplateParam), source.getRepository(Attempt),
      {} as any, source, { getUser: () => currentUser } as any,
      { decorateAssignments: async (rows: Assignment[]) => rows, assertCurrentUserNotSuspended: async () => {} } as any,
      { assertAssignmentAccess: async () => {}, assertClassAccess: async () => {} } as any,
    );
  }, 60000);

  afterAll(async () => {
    if (source.isInitialized) {
      try { await source.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); }
      finally { await source.destroy(); }
    }
  });

  it('preserves complete collections without duplicate entities', async () => {
    currentUser = { userId: teacher.id, role: UserRole.ADMIN };
    const rows = await service.findAllUserAssignments();
    expect(rows).toHaveLength(3);
    const first = rows.find(row => row.id === assignments[0].id)!;
    expect(first.assignmentAttempts).toHaveLength(81);
    expect(new Set(first.assignmentAttempts.map(attempt => attempt.id)).size).toBe(81);
    expect(first.class.userClasses).toHaveLength(62);
    expect(first.assignmentAttempts[0].receivedWork?.code).toHaveLength(1024);
  });

  it('keeps student history private and ordered, including boilerplate aliases', async () => {
    currentUser = { userId: students[0].id, role: UserRole.STUDENT };
    const row = await service.findOne(assignments[0].id);
    expect(row.assignmentAttempts).toHaveLength(2);
    expect(row.assignmentAttempts.every(attempt => attempt.userId === students[0].id)).toBe(true);
    expect(row.assignmentAttempts[0].createdAt.getTime()).toBeGreaterThan(row.assignmentAttempts[1].createdAt.getTime());
    expect(row.class.userClasses).toHaveLength(1);
    expect(row).toMatchObject({ boilerplate: 'test boilerplate', validationScript: 'test boilerplate' });
  });

  it('prepares execution without histories or all class members', async () => {
    currentUser = { userId: teacher.id, role: UserRole.ADMIN };
    const row = await service.findOne(assignments[0].id, false);
    expect(row.assignmentAttempts).toBeUndefined();
    expect(row.class.userClasses).toBeUndefined();
    expect(row.assignmentParams).toEqual([]);
    expect(row.assignmentTemplates).toEqual([]);
    expect(row).toMatchObject({ boilerplate: 'test boilerplate' });
  });

  it('lists admin assignments without histories and includes deactivated class names', async () => {
    currentUser = { userId: teacher.id, role: UserRole.ADMIN };
    const classes = source.getRepository(Class);
    await classes.softDelete(assignments[0].classId);
    try {
      const page = await service.findAllPaginated({ page: 1, pageSize: 10 });
      expect(page.meta.total).toBe(3);
      expect(page.data.find(row => row.id === assignments[0].id)).toMatchObject({
        title: 'First', class: { name: 'Large class' },
      });
      for (const row of page.data) {
        expect(Object.keys(row).sort()).toEqual([
          'class', 'description', 'dueDate', 'id', 'startDate', 'title', 'workerType',
        ]);
        expect(Object.keys(row.class)).toEqual(['name']);
      }
    } finally {
      await classes.restore(assignments[0].classId);
    }
    currentUser = { userId: teacher.id, role: UserRole.TEACHER };
    expect((await service.findAllPaginated({ page: 1, pageSize: 10 })).data).toHaveLength(2);
  });

  it('returns only template list fields, keeping content available on the detail route', async () => {
    const template = await source.getRepository(Template).save({
      classId: assignments[0].classId, title: 'Heavy template', description: 'Synthetic',
      content: 'x'.repeat(200_000), workerType: WorkerType.NODE_DEFAULT,
    });
    const templates = new TemplateService(source.getRepository(Template),
      source.getRepository(TemplateParam), source.getRepository(AssignmentTemplate),
      { user: () => ({ userId: teacher.id }), isAdmin: () => true,
        assertTemplateAccess: async () => {} } as any);
    const page = await templates.findAllPaginated({ page: 1, pageSize: 10 });
    expect(page.data).toEqual([expect.objectContaining({ id: template.id, title: template.title })]);
    expect(Object.keys(page.data[0]).sort()).toEqual(['description', 'id', 'title', 'workerType']);
    expect((await templates.findOne(template.id)).content).toHaveLength(200_000);
  });

  it('returns user summaries without password hashes or class memberships', async () => {
    const users = new UserService(source.getRepository(User), source.getRepository(RefreshSession));
    const page = await users.findAllPaginated({ page: 1, pageSize: 10 });
    expect(page.meta.total).toBe(64);
    expect(page.data).toHaveLength(10);
    for (const row of page.data) {
      expect(Object.keys(row).sort()).toEqual(['email', 'id', 'name', 'role']);
    }
  });

  it('summarizes the current student latest attempt, accepted history and active suspension', async () => {
    const assignmentId = assignments[0].id;
    const userId = students[0].id;
    const attempts = source.getRepository(Attempt);
    await attempts.save([
      { assignmentId, userId, attempt: 100, status: AttemptStatus.COMPLETED,
        isAcceptable: true, score: 1, passes: 1, fails: 0, report: 'old accepted' },
      { assignmentId, userId, attempt: 101, status: AttemptStatus.COMPLETED,
        isAcceptable: false, score: 0.5, passes: 1, fails: 1, report: 'latest rejected' },
      { assignmentId: assignments[1].id, userId: students[1].id, attempt: 102,
        status: AttemptStatus.COMPLETED, isAcceptable: true, score: 1, passes: 1,
        fails: 0, report: 'other student accepted' },
    ]);
    await source.getRepository(Assignment).update(assignmentId, { suspensionAlertLimit: 1 });
    const alerts = source.getRepository(AssignmentUserAlert);
    const alert = await alerts.save({ assignmentId, userId, eventId: randomUUID(),
      type: AssignmentAlertType.WINDOW_FOCUS_LOSS });
    currentUser = { userId, role: UserRole.STUDENT };
    const rows = await service.findAssignmentsByClass(assignments[0].classId);
    expect(rows.find(row => row.id === assignmentId)).toMatchObject({
      lastAttempt: { status: 'completed', score: 0.5, isAcceptable: false },
      hasAcceptedAttempt: true, currentUserAlertStatus: { suspended: true },
    });
    expect(rows.find(row => row.id === assignments[1].id)?.hasAcceptedAttempt).toBe(false);
    expect(JSON.stringify(rows)).not.toMatch(/receivedWork|report|boilerplate|assignmentAttempts/);
    await alerts.softDelete(alert.id);
    const recovered = await service.findAssignmentsByClass(assignments[0].classId);
    expect(recovered.find(row => row.id === assignmentId)?.currentUserAlertStatus?.suspended).toBe(false);
  });
});
