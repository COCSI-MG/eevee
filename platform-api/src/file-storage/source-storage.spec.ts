import { type ExecutionContext, ForbiddenException, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import * as request from 'supertest';
import { AssignmentStorageController } from 'src/assignment/assignment-storage.controller';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';
import { ClassAccessService } from 'src/auth/class-access.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestContextService } from 'src/request-context/request-context.service';
import { UserRole } from 'src/user/user-role';
import {
  createStorageGrant,
  resolveStorageSnapshot,
  storageConfig,
  validateStorageSnapshotReference,
} from './source-storage';
import { SchedulingService } from '../scheduling/scheduling.service';
import { AttemptService } from '../attempt/attempt.service';
// The service fixture is compiled by make setup and CI before the Nest tests.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createServer } = require(
  resolve(process.cwd(), '../file-storage-api/dist/server.js'),
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { hash } = require(
  resolve(process.cwd(), '../file-storage-api/dist/store.js'),
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyGrant } = require(
  resolve(process.cwd(), '../file-storage-api/dist/grants.js'),
);

describe('local file-storage API integration', () => {
  const secret = 'local-synthetic-storage-secret-do-not-use-in-production';
  let server: any, store: any, root: string;
  const saved = { ...process.env };
  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'eevee-api-storage-'));
    ({ server, store } = createServer({
      root,
      secret,
      storageLimits: { maxFileBytes: 2 * 1024 * 1024, maxProjectBytes: 6 * 1024 * 1024 },
    }));
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    Object.assign(process.env, {
      ENV: 'local',
      EEVEE_STORAGE_SIGNING_SECRET: secret,
      EEVEE_STORAGE_URL: `http://127.0.0.1:${server.address().port}`,
    });
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(resolve));
    rmSync(root, { recursive: true, force: true });
    process.env = saved;
  });
  function snapshot(files: Record<string, string>, kind = 'submission', scope = 'eevee-u1-a1') {
    const refs = {};
    for (const [name, content] of Object.entries(files)) {
      const bytes = Buffer.from(content);
      refs[name] = { digest: hash(bytes), size: bytes.length };
      store.putBlob(scope, hash(bytes), bytes);
    }
    const current = store.workspace(scope);
    store.saveWorkspace(scope, current.revision, refs);
    return store.snapshot(scope, current.revision + 1, kind);
  }
  it('signs only principal+assignment scope using the same protocol as the storage server', () => {
    const grant = createStorageGrant(1, 1);
    expect(verifyGrant(secret, grant.token, 'eevee-u1-a1', 'write').scope).toBe(
      'eevee-u1-a1',
    );
    expect(() =>
      verifyGrant(secret, grant.token, 'eevee-u2-a1', 'read'),
    ).toThrow();
    expect(() => createStorageGrant(-1, 1)).toThrow();
  });
  it('resolves immutable bytes and rejects cross-user and wrong-purpose references', async () => {
    const files = {
      'src/app.ts': '\ufeffexport const answer = 42; // olá',
      'src/util.ts': 'export const value = 1;',
    };
    const snap = snapshot(files);
    expect(await resolveStorageSnapshot(1, 1, snap.id, 'submission')).toEqual(
      files,
    );
    await expect(
      resolveStorageSnapshot(2, 1, snap.id, 'submission'),
    ).rejects.toThrow();
    await expect(
      resolveStorageSnapshot(1, 2, snap.id, 'submission'),
    ).rejects.toThrow();
    await expect(
      resolveStorageSnapshot(1, 1, snap.id, 'preview'),
    ).rejects.toThrow();
  });
  it('reads a submission saved under a larger file quota', async () => {
    const files = { 'large.ts': 'x'.repeat(1024 * 1024 + 1) };
    const { id } = snapshot(files);
    await expect(resolveStorageSnapshot(1, 1, id, 'submission')).resolves.toEqual(files);
  });
  it('validates manifests larger than the default workspace request limit', async () => {
    const files = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [
        `src/${'漢'.repeat(228)}${index}.ts`,
        'export {};',
      ]),
    );
    const { id, ...manifest } = snapshot(files);
    expect(Buffer.byteLength(JSON.stringify(manifest))).toBeGreaterThan(64 * 1024);
    await expect(
      validateStorageSnapshotReference(1, 1, id, 'submission'),
    ).resolves.toEqual({ scope: 'eevee-u1-a1', id, kind: 'submission' });
  });
  it('refuses ambiguous inline and snapshot requests', async () => {
    const snap = snapshot({ 'app.ts': 'source' });
    const context: any = {
      classAccess: { assertAssignmentAccess: jest.fn() },
      requestContextService: { getUser: () => ({ userId: 1 }) },
    };
    await expect(
      (SchedulingService.prototype as any).resolveSourceSnapshot.call(
        context,
        { assignmentId: 1, sourceSnapshotId: snap.id, files: {} },
        'submission',
      ),
    ).rejects.toThrow('never both');
  });
  it('uses a same-origin browser grant and reads files from the configured backend', async () => {
    process.env.ENV = 'production';
    process.env.EEVEE_STORAGE_PUBLIC_URL = '/storage';
    expect(createStorageGrant(1, 1).url).toBe('/storage');
    const files = { 'app.js': '\ufeffconsole.log("byte exact");' };
    const snap = snapshot(files);
    expect(await resolveStorageSnapshot(1, 1, snap.id, 'submission')).toEqual(
      files,
    );
    for (const value of [
      '//evil.example',
      'javascript:alert(1)',
      '/storage?token=bad',
      'https://user:pass@example.com/',
    ]) {
      process.env.EEVEE_STORAGE_PUBLIC_URL = value;
      expect(() => storageConfig()).toThrow();
    }
    delete process.env.EEVEE_STORAGE_PUBLIC_URL;
    process.env.ENV = 'local';
  });
  it('validates only a manifest before queueing a reference', async () => {
    const snap = snapshot({ 'src/app.ts': 'export const answer = 42;' });
    const dto: any = { assignmentId: 1, sourceSnapshotId: snap.id };
    const context = {
      classAccess: { assertAssignmentAccess: jest.fn() },
      requestContextService: { getUser: () => ({ userId: 1 }) },
    };
    const requests = jest.spyOn(globalThis, 'fetch');
    try {
      await (SchedulingService.prototype as any).resolveSourceSnapshot.call(context, dto, 'submission');
      expect(dto).toEqual({
        assignmentId: 1,
        sourceSnapshot: { scope: 'eevee-u1-a1', id: snap.id, kind: 'submission' },
      });
      expect(requests).toHaveBeenCalledTimes(1);
      expect(requests.mock.calls[0][0]).toMatch(/\/manifest$/);
      expect(context.classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, false);
    } finally {
      requests.mockRestore();
    }
  });
  it('returns the exact submission to authorized staff, with a legacy fallback', async () => {
    const files = { 'src/app.ts': '\ufeffsnapshot code' };
    const { id } = snapshot(files);
    const attempt = { id: 12, assignmentId: 1, userId: 1, attempt: 2, sourceSnapshotId: id };
    const context = {
      classAccess: { assertAssignmentAccess: jest.fn() },
      attemptRepository: { findOne: jest.fn().mockResolvedValue(attempt) },
    };
    const read = () => AttemptService.prototype.findSubmittedWorkForAdmin.call(context, 1, 1, 12);
    await expect(read()).resolves.toMatchObject({ attemptId: 12, files });
    expect(context.classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(context.attemptRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 12, assignmentId: 1, userId: 1 },
    }));
    context.attemptRepository.findOne.mockResolvedValue({ ...attempt, sourceSnapshotId: null, receivedWork: { 'legacy.ts': 'old code' } });
    await expect(read()).resolves.toMatchObject({ files: { 'legacy.ts': 'old code' } });
    context.attemptRepository.findOne.mockResolvedValue(null);
    await expect(read()).rejects.toThrow('Submitted project not found');
    context.attemptRepository.findOne.mockClear();
    context.classAccess.assertAssignmentAccess.mockRejectedValue(new Error('Class not found'));
    await expect(read()).rejects.toThrow('Class not found');
    expect(context.attemptRepository.findOne).not.toHaveBeenCalled();
  });
  it('issues assignment workspace and staff answer-key grants with their own scopes', async () => {
    let role: UserRole = UserRole.STUDENT;
    const classAccess = { assertAssignmentAccess: jest.fn() };
    const assignmentAlerts = { assertCurrentUserNotSuspended: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [AssignmentStorageController],
      providers: [
        { provide: ClassAccessService, useValue: classAccess },
        { provide: AssignmentAlertService, useValue: assignmentAlerts },
        { provide: RequestContextService, useValue: { getUser: () => ({ userId: 1 }) } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context.switchToHttp().getRequest().user = { role };
          return true;
        },
      })
      .compile();
    const app = module.createNestApplication();
    try {
      app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
      await app.init();
      const http = request(app.getHttpServer());
      const workspace = '/v1/assignment-storage/1/workspace/grant';
      const answerKey = '/v1/assignment-storage/1/answer-key/grant';

      const regular = await http.get(workspace).expect('Cache-Control', 'no-store').expect(200);
      expect(classAccess.assertAssignmentAccess).toHaveBeenLastCalledWith(1, false);
      expect(assignmentAlerts.assertCurrentUserNotSuspended).toHaveBeenLastCalledWith(1);
      expect(verifyGrant(secret, regular.body.token, 'eevee-u1-a1', 'write').scope).toBe('eevee-u1-a1');
      await http.get(answerKey).expect(403);

      role = UserRole.TEACHER;
      const teacher = await http.get(answerKey).expect('Cache-Control', 'no-store').expect(200);
      expect(classAccess.assertAssignmentAccess).toHaveBeenLastCalledWith(1, true);
      expect(verifyGrant(secret, teacher.body.token, 'eevee-u1-a1-answer-key', 'write').scope).toBe(
        'eevee-u1-a1-answer-key',
      );
      expect(() => verifyGrant(secret, teacher.body.token, 'eevee-u1-a1', 'write')).toThrow();
      assignmentAlerts.assertCurrentUserNotSuspended.mockRejectedValueOnce(new ForbiddenException());
      await http.get(workspace).expect(403);
    } finally {
      await app.close();
    }
  });
  it('validates an answer-key snapshot only in the instructor scope', async () => {
    const scope = 'eevee-u1-a1-answer-key';
    const { id } = snapshot({ 'app.ts': 'answer key' }, 'answer-key', scope);
    const context = {
      classAccess: { assertAssignmentAccess: jest.fn() },
      requestContextService: { getUser: () => ({ userId: 1 }) },
    };
    const resolve = (dto: { assignmentId: number; sourceSnapshotId?: string }, kind: 'answer-key' | 'submission') =>
      (SchedulingService.prototype as any).resolveSourceSnapshot.call(context, dto, kind);
    const dto = { assignmentId: 1, sourceSnapshotId: id };
    await expect(resolve(dto, 'answer-key')).resolves.toBeUndefined();
    expect(context.classAccess.assertAssignmentAccess).toHaveBeenCalledWith(1, true);
    expect(dto).toEqual({ assignmentId: 1, sourceSnapshot: { scope, id, kind: 'answer-key' } });
    await expect(resolve({ assignmentId: 1, sourceSnapshotId: id }, 'submission')).rejects.toThrow();
    await expect(resolve({ assignmentId: 1 }, 'answer-key')).rejects.toThrow('snapshot is required');
  });
  it('refuses external backend destinations', () => {
    const original = process.env.EEVEE_STORAGE_URL;
    process.env.EEVEE_STORAGE_URL = 'https://example.com';
    expect(() => storageConfig()).toThrow();
    process.env.EEVEE_STORAGE_URL = original;
    process.env.ENV = 'production';
    expect(storageConfig().url).toBe(original);
    process.env.ENV = 'local';
  });
});
