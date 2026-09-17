import { HttpException, NotFoundException } from '@nestjs/common';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { UserClass } from 'src/user-class/entities/user-class.entity';
import { EntityManager, Repository } from 'typeorm';
import { AssignmentAlertService } from './assignment-alert.service';
import { AssignmentAlertRule } from './entities/assignment-alert-rule.entity';
import { AssignmentUserAlert } from './entities/assignment-user-alert.entity';
import { AssignmentAlertType } from './enums/assignment-alert-type.enum';

describe('AssignmentAlertService', () => {
  const createService = (options?: {
    activeCount?: number;
    duplicate?: AssignmentUserAlert | null;
    ruleExists?: boolean;
    limit?: number;
    isAdmin?: boolean;
    archiveAlert?: AssignmentUserAlert | null;
  }) => {
    const alertRepository = {
      count: jest.fn().mockResolvedValue(options?.activeCount ?? 0),
      manager: { transaction: jest.fn() }
    } as unknown as jest.Mocked<Repository<AssignmentUserAlert>>;

    const ruleRepository = {} as jest.Mocked<Repository<AssignmentAlertRule>>;

    const assignmentRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 4,
        classId: 9,
        suspensionAlertLimit: options?.limit ?? 5
      })
    } as unknown as jest.Mocked<Repository<Assignment>>;

    const userClassRepository = {
      findOne: jest.fn().mockResolvedValue({ classId: 9, userId: 7 })
    } as unknown as jest.Mocked<Repository<UserClass>>;

    const requestContextService = {
      getUser: jest.fn().mockReturnValue({
        userId: 7,
        isAdmin: options?.isAdmin ?? false
      })
    };

    const duplicateQueryBuilder = {
      withDeleted: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(options?.duplicate ?? null)
    };

    const archiveQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 })
    };

    const transactionalAlertRepository = {
      createQueryBuilder: jest.fn((alias?: string) => alias ? duplicateQueryBuilder : archiveQueryBuilder),
      findOne: jest.fn().mockResolvedValue(options?.archiveAlert ?? null),
      count: jest.fn().mockResolvedValue(options?.activeCount ?? 0),
      create: jest.fn((value) => value),
      save: jest.fn()
    };

    const transactionalRuleRepository = {
      exists: jest.fn().mockResolvedValue(options?.ruleExists ?? true)
    };

    const manager = {
      query: jest.fn(),
      getRepository: jest.fn((entity) => entity === AssignmentUserAlert ? transactionalAlertRepository : transactionalRuleRepository)
    } as unknown as EntityManager;

    (alertRepository.manager.transaction as jest.Mock).mockImplementation((callback) => callback(manager));

    const service = new AssignmentAlertService(
      alertRepository,
      ruleRepository,
      assignmentRepository,
      userClassRepository,
      requestContextService as never
    );

    return {
      service,
      alertRepository,
      assignmentRepository,
      transactionalAlertRepository,
      transactionalRuleRepository,
      archiveQueryBuilder,
      manager
    };
  };

  const event = {
    eventId: '9eb418dc-a305-4bdd-9a25-3ef3c6f57185',
    type: AssignmentAlertType.CLIPBOARD,
    occurredAt: '2026-09-06T12:00:00.000Z',
    details: { clipboardAction: 'paste' as const }
  };

  it('records a configured event and derives suspension from the active count', async () => {
    const {
      service,
      transactionalAlertRepository,
      transactionalRuleRepository,
      manager
    } = createService({ activeCount: 1, limit: 2 });

    await expect(service.recordCurrentUserAlert(4, event)).resolves.toEqual({
      recorded: true,
      duplicate: false,
      activeCount: 2,
      limit: 2,
      suspended: true
    });

    expect(manager.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1, $2)',
      [4, 7]
    );
    expect(transactionalRuleRepository.exists).toHaveBeenCalledWith({
      where: { assignmentId: 4, type: AssignmentAlertType.CLIPBOARD }
    });
    expect(transactionalAlertRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: event.eventId,
        assignmentId: 4,
        userId: 7,
        type: AssignmentAlertType.CLIPBOARD,
        details: { clipboardAction: 'paste' }
      })
    );
  });

  it('does not persist an event whose type is not punitive for the assignment', async () => {
    const { service, transactionalAlertRepository } = createService({
      activeCount: 3,
      limit: 5,
      ruleExists: false
    });

    await expect(service.recordCurrentUserAlert(4, event)).resolves.toEqual({
      recorded: false,
      duplicate: false,
      activeCount: 3,
      limit: 5,
      suspended: false
    });
    expect(transactionalAlertRepository.save).not.toHaveBeenCalled();
  });

  it('returns an existing event idempotently without adding another alert', async () => {
    const { service, transactionalAlertRepository } = createService({
      activeCount: 2,
      limit: 5,
      duplicate: { id: 10 } as AssignmentUserAlert
    });

    await expect(service.recordCurrentUserAlert(4, event)).resolves.toEqual({
      recorded: true,
      duplicate: true,
      activeCount: 2,
      limit: 5,
      suspended: false
    });
    expect(transactionalAlertRepository.save).not.toHaveBeenCalled();
  });

  it('raises HTTP 423 when the derived status reaches the configured limit', async () => {
    const { service } = createService({ activeCount: 4, limit: 4 });

    try {
      await service.assertCurrentUserNotSuspended(4);
      throw new Error('Expected the operation to be blocked');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(423);
      expect((error as HttpException).getResponse()).toEqual(
        expect.objectContaining({
          code: 'ASSIGNMENT_SUSPENDED',
          alertStatus: { activeCount: 4, limit: 4, suspended: true }
        })
      );
    }
  });

  it('never records punitive alerts for administrators', async () => {
    const { service, assignmentRepository } = createService({ isAdmin: true });

    await expect(service.recordCurrentUserAlert(4, event)).resolves.toEqual(
      expect.objectContaining({ recorded: false, suspended: false })
    );
    expect(assignmentRepository.findOne).not.toHaveBeenCalled();
  });

  it('archives only the selected alert and recalculates the student status', async () => {
    const {
      service,
      transactionalAlertRepository,
      archiveQueryBuilder,
      manager
    } = createService({
      activeCount: 1,
      limit: 2,
      isAdmin: true,
      archiveAlert: {
        id: 18,
        assignmentId: 4,
        userId: 11,
        deletedAt: null
      } as AssignmentUserAlert
    });

    const result = await service.archiveAlert(4, 11, 18);

    expect(manager.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1, $2)',
      [4, 11]
    );
    expect(transactionalAlertRepository.findOne).toHaveBeenCalledWith({
      where: { id: 18, assignmentId: 4, userId: 11 },
      withDeleted: true
    });
    expect(archiveQueryBuilder.update).toHaveBeenCalledWith(AssignmentUserAlert);

    expect(archiveQueryBuilder.set).toHaveBeenCalledWith({deletedAt: expect.any(Date), archivedByUserId: 7});

    expect(archiveQueryBuilder.where).toHaveBeenCalledWith('id = :alertId', { alertId: 18 });

    expect(archiveQueryBuilder.andWhere).toHaveBeenCalledWith('assignmentId = :assignmentId', { assignmentId: 4 } );

    expect(archiveQueryBuilder.andWhere).toHaveBeenCalledWith('userId = :userId', { userId: 11 });

    expect(archiveQueryBuilder.andWhere).toHaveBeenCalledWith('deletedAt IS NULL');

    expect(result).toEqual({
      alertId: 18,
      archivedAt: expect.any(Date),
      activeCount: 1,
      limit: 2,
      suspended: false
    });
  });

  it('returns 404 when the alert does not belong to the assignment and user', async () => {
    const { service, archiveQueryBuilder } = createService({
      isAdmin: true,
      archiveAlert: null
    });

    await expect(service.archiveAlert(4, 11, 99)).rejects.toBeInstanceOf(NotFoundException);

    expect(archiveQueryBuilder.execute).not.toHaveBeenCalled();
  });

  it('keeps the original archive date when the same alert is archived again', async () => {
    const archivedAt = new Date('2026-09-08T18:30:00.000Z');
    const { service, archiveQueryBuilder } = createService({
      activeCount: 3,
      limit: 5,
      isAdmin: true,
      archiveAlert: {
        id: 18,
        assignmentId: 4,
        userId: 11,
        deletedAt: archivedAt,
        archivedByUserId: 6
      } as AssignmentUserAlert
    });

    await expect(service.archiveAlert(4, 11, 18)).resolves.toEqual({
      alertId: 18,
      archivedAt,
      activeCount: 3,
      limit: 5,
      suspended: false
    });
    expect(archiveQueryBuilder.execute).not.toHaveBeenCalled();
  });
});
