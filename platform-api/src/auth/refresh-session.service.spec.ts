import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { DataSource, IsNull, LessThan } from 'typeorm';
import { createHash } from 'crypto';
import { RefreshSessionService } from './refresh-session.service';
import { RefreshSession } from './entities/refresh-session.entity';
import { SessionStatus } from './enums/session-status.enum';
import { DEFAULT_AUTH_REFRESH_TTL_SECONDS } from './auth-cookie.util';

const hashOf = (token: string) =>
  createHash('sha256').update(token).digest('hex');

describe('RefreshSessionService', () => {
  let service: RefreshSessionService;
  let refreshSessionRepository: {
    save: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  let manager: { save: jest.Mock; update: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let cleanupQueue: {
    add: jest.Mock;
    getRepeatableJobs: jest.Mock;
    removeRepeatableByKey: jest.Mock;
  };

  const buildSession = (overrides: Partial<RefreshSession> = {}) =>
    ({
      id: 'session-1',
      userId: 7,
      familyId: 'family-1',
      tokenHash: hashOf('token-atual'),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedBy: null,
      ...overrides,
    }) as RefreshSession;

  beforeEach(async () => {
    refreshSessionRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      count: jest.fn().mockResolvedValue(0),
    };

    manager = {
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    dataSource = {
      transaction: jest.fn((callback: any) => callback(manager)),
    };

    cleanupQueue = {
      add: jest.fn(),
      getRepeatableJobs: jest.fn().mockResolvedValue([]),
      removeRepeatableByKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionService,
        {
          provide: getRepositoryToken(RefreshSession),
          useValue: refreshSessionRepository,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getQueueToken('session-cleanup-queue'), useValue: cleanupQueue },
      ],
    }).compile();

    service = module.get<RefreshSessionService>(RefreshSessionService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('opens a new family and stores only the token hash', async () => {
      refreshSessionRepository.save.mockImplementation(async (row) => row);

      const { token, session } = await service.create(7);

      expect(refreshSessionRepository.save).toHaveBeenCalledTimes(1);
      const saved = refreshSessionRepository.save.mock.calls[0][0];

      expect(saved.userId).toBe(7);
      expect(saved.familyId).toEqual(expect.any(String));
      expect(saved.tokenHash).toBe(hashOf(token));
      expect(saved.revokedAt).toBeNull();
      expect(saved.replacedBy).toBeNull();
      expect(session).toBe(saved);
    });

    it('never stores the raw token', async () => {
      refreshSessionRepository.save.mockImplementation(async (row) => row);

      const { token } = await service.create(7);
      const saved = refreshSessionRepository.save.mock.calls[0][0];

      expect(JSON.stringify(saved)).not.toContain(token);
    });

    it('uses the default ttl when the variable is unset', async () => {
      // Relógio travado: sem isso a asserção depende de quanto tempo passa
      // entre a leitura do horário aqui e o cálculo dentro do service.
      jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
      refreshSessionRepository.save.mockImplementation(async (row) => row);

      await service.create(7);

      const { expiresAt } = refreshSessionRepository.save.mock.calls[0][0];

      expect(expiresAt).toEqual(
        new Date(Date.now() + DEFAULT_AUTH_REFRESH_TTL_SECONDS * 1000),
      );
    });
  });

  describe('rotate', () => {
    it('denies an unknown token', async () => {
      refreshSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.rotate('qualquer')).resolves.toEqual({
        status: SessionStatus.DENIED,
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('denies an expired token without revoking the family', async () => {
      refreshSessionRepository.findOne.mockResolvedValue(
        buildSession({ expiresAt: new Date(Date.now() - 1_000) }),
      );

      await expect(service.rotate('token-atual')).resolves.toEqual({
        status: SessionStatus.DENIED,
      });
      expect(refreshSessionRepository.update).not.toHaveBeenCalled();
    });

    it('inherits family and expiry, and links the replaced row', async () => {
      const current = buildSession();
      refreshSessionRepository.findOne.mockResolvedValue(current);
      manager.save.mockImplementation(async (_entity, row) => ({
        ...row,
        id: 'session-2',
      }));

      const result = await service.rotate('token-atual');

      expect(result.status).toBe(SessionStatus.ROTATED);

      const [, created] = manager.save.mock.calls[0];
      expect(created.familyId).toBe(current.familyId);
      expect(created.expiresAt).toBe(current.expiresAt);
      expect(created.userId).toBe(current.userId);

      const [, criteria, patch] = manager.update.mock.calls[0];
      expect(criteria).toEqual({ id: current.id, revokedAt: IsNull() });
      expect(patch.replacedBy).toBe('session-2');
      expect(patch.revokedAt).toEqual(expect.any(Date));
    });

    it('returns a token whose hash matches the stored one', async () => {
      refreshSessionRepository.findOne.mockResolvedValue(buildSession());
      manager.save.mockImplementation(async (_entity, row) => ({
        ...row,
        id: 'session-2',
      }));

      const result = await service.rotate('token-atual');

      expect(result.status).toBe(SessionStatus.ROTATED);
      if (result.status !== SessionStatus.ROTATED) return;

      const [, created] = manager.save.mock.calls[0];
      expect(created.tokenHash).toBe(hashOf(result.token));
    });

    it('revokes the whole family when a rotated token is reused', async () => {
      refreshSessionRepository.findOne.mockResolvedValue(
        buildSession({
          revokedAt: new Date(Date.now() - 60_000),
          replacedBy: 'session-2',
        }),
      );

      await expect(service.rotate('token-atual')).resolves.toEqual({
        status: SessionStatus.DENIED,
      });
      expect(refreshSessionRepository.update).toHaveBeenCalledWith(
        { familyId: 'family-1', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });

    it('warns on reuse without leaking the token', async () => {
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);
      refreshSessionRepository.findOne.mockResolvedValue(
        buildSession({
          revokedAt: new Date(Date.now() - 60_000),
          replacedBy: 'session-2',
        }),
      );

      await service.rotate('token-atual');

      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain('userId=7');
      expect(message).toContain('familyId=family-1');
      expect(message).not.toContain('token-atual');
      expect(message).not.toContain(hashOf('token-atual'));
    });

    it('does not revoke the family when the reuse is inside the grace window', async () => {
      const debugSpy = jest
        .spyOn((service as any).logger, 'debug')
        .mockImplementation(() => undefined);
      refreshSessionRepository.findOne.mockResolvedValue(
        buildSession({
          revokedAt: new Date(Date.now() - 1_000),
          replacedBy: 'session-2',
        }),
      );

      await expect(service.rotate('token-atual')).resolves.toEqual({
        status: SessionStatus.RACED,
      });
      expect(refreshSessionRepository.update).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();
    });

    it('rolls back and reports a race when another request rotated first', async () => {
      refreshSessionRepository.findOne.mockResolvedValue(buildSession());
      manager.save.mockImplementation(async (_entity, row) => ({
        ...row,
        id: 'session-2',
      }));
      manager.update.mockResolvedValue({ affected: 0 });
      dataSource.transaction.mockImplementation(async (callback: any) => {
        // A transação real desfaz a linha criada quando o callback lança.
        return callback(manager);
      });

      await expect(service.rotate('token-atual')).resolves.toEqual({
        status: SessionStatus.RACED,
      });
    });
  });

  describe('revoke', () => {
    it('revokes only the active rows of a family', async () => {
      await service.revokeFamily('family-1');

      expect(refreshSessionRepository.update).toHaveBeenCalledWith(
        { familyId: 'family-1', revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });

    it('revokes only the active rows of a user', async () => {
      await service.revokeAllForUser(7);

      expect(refreshSessionRepository.update).toHaveBeenCalledWith(
        { userId: 7, revokedAt: IsNull() },
        { revokedAt: expect.any(Date) },
      );
    });
  });
  describe('cleanupExpiredSessions', () => {
    it('deletes only families expired past the retention window', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-20T03:00:00Z'));
      refreshSessionRepository.delete.mockResolvedValue({ affected: 42 });

      await service.cleanupExpiredSessions();

      expect(refreshSessionRepository.delete).toHaveBeenCalledWith({
        expiresAt: LessThan(new Date('2026-01-13T03:00:00Z')),
      });
    });

    it('reports how many rows went and how many stayed', async () => {
      const logSpy = jest
        .spyOn((service as any).logger, 'log')
        .mockImplementation(() => undefined);
      refreshSessionRepository.delete.mockResolvedValue({ affected: 42 });
      refreshSessionRepository.count.mockResolvedValue(1_337);

      await service.cleanupExpiredSessions();

      const message = logSpy.mock.calls[0][0] as string;
      expect(message).toContain('42 linha(s) removida(s)');
      expect(message).toContain('1337 linha(s) restante(s)');
    });

    it('logs the failure instead of breaking the schedule', async () => {
      const errorSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => undefined);
      refreshSessionRepository.delete.mockRejectedValue(new Error('banco fora'));

      await expect(service.cleanupExpiredSessions()).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
  describe('onModuleInit', () => {
    it('schedules the cleanup as a repeatable job', async () => {
      await service.onModuleInit();

      expect(cleanupQueue.add).toHaveBeenCalledWith(
        'cleanup-expired-sessions',
        {},
        expect.objectContaining({
          repeat: { pattern: '0 3 * * *' },
        }),
      );
    });

    it('clears previous schedules so a changed interval does not double up', async () => {
      cleanupQueue.getRepeatableJobs.mockResolvedValue([
        { key: 'antigo-1' },
        { key: 'antigo-2' },
      ]);

      await service.onModuleInit();

      expect(cleanupQueue.removeRepeatableByKey).toHaveBeenCalledWith('antigo-1');
      expect(cleanupQueue.removeRepeatableByKey).toHaveBeenCalledWith('antigo-2');
    });
  });
});
