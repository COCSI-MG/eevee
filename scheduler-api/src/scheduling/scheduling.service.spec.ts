import { BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { WorkerService } from 'src/worker/worker.service';
import { AttemptService } from 'src/attempt/attempt.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import { ScorePolicyService } from './score-policy.service';
import { SchedulingWorkerPreparationService } from './scheduling-worker-preparation.service';
import { SchedulingAttemptTransitionService } from './scheduling-attempt-transition.service';
import { Queue } from 'bullmq';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { RequestContextService } from 'src/request-context/request-context.service';
import { SchedulingPreviewRun } from './entities/scheduling-preview-run.entity';
import { Repository } from 'typeorm';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let workerService: jest.Mocked<
    Pick<
      WorkerService,
      'createWorkerWithInitContainer' | 'createSynchronousWorker' | 'cancelWorkerJob'
    >
  >;
  let attemptService: jest.Mocked<
    Pick<
      AttemptService,
      | 'findAllByAssignmentAndCurrentUser'
      | 'create'
      | 'isUserAbleToAttemptAssignment'
      | 'findOne'
      | 'createForUser'
      | 'getNextAttemptNumber'
    >
  >;
  let assignmentService: jest.Mocked<Pick<AssignmentService, 'findOne'>>;
  let scorePolicyService: jest.Mocked<Pick<ScorePolicyService, 'calculateScore' | 'isAcceptable'>>;
  let schedulingWorkerPreparationService: jest.Mocked<Pick<SchedulingWorkerPreparationService, 'prepare'>>;
  let schedulingAttemptTransitionService: jest.Mocked<
    Pick<
      SchedulingAttemptTransitionService,
      'markRunning' | 'markFailedNoTests' | 'markCompleted' | 'markFailedWorkerError'
    >
  >;
  let schedulingQueue: jest.Mocked<Pick<Queue, 'add'>>;
  let requestContextService: jest.Mocked<Pick<RequestContextService, 'getUser'>>;
  let schedulingPreviewRunRepository: jest.Mocked<
    Pick<Repository<SchedulingPreviewRun>, 'findOne' | 'save' | 'update'>
  >;

  beforeEach(() => {
    workerService = {
      createWorkerWithInitContainer: jest.fn(),
      createSynchronousWorker: jest.fn(),
      cancelWorkerJob: jest.fn(),
    };

    attemptService = {
      findAllByAssignmentAndCurrentUser: jest.fn(),
      create: jest.fn(),
      isUserAbleToAttemptAssignment: jest.fn(),
      findOne: jest.fn(),
      createForUser: jest.fn(),
      getNextAttemptNumber: jest.fn(),
    };

    assignmentService = {
      findOne: jest.fn(),
    };

    scorePolicyService = {
      calculateScore: jest.fn(),
      isAcceptable: jest.fn(),
    };

    schedulingWorkerPreparationService = {
      prepare: jest.fn(),
    };

    schedulingAttemptTransitionService = {
      markRunning: jest.fn(),
      markFailedNoTests: jest.fn(),
      markCompleted: jest.fn(),
      markFailedWorkerError: jest.fn(),
    };

    schedulingQueue = {
      add: jest.fn(),
    };

    requestContextService = {
      getUser: jest.fn().mockReturnValue({ userId: 42, isAdmin: false }),
    };

    schedulingPreviewRunRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    service = new SchedulingService(
      workerService as unknown as WorkerService,
      attemptService as unknown as AttemptService,
      assignmentService as unknown as AssignmentService,
      scorePolicyService as unknown as ScorePolicyService,
      schedulingWorkerPreparationService as unknown as SchedulingWorkerPreparationService,
      schedulingAttemptTransitionService as unknown as SchedulingAttemptTransitionService,
      requestContextService as unknown as RequestContextService,
      schedulingPreviewRunRepository as unknown as Repository<SchedulingPreviewRun>,
      schedulingQueue as unknown as Queue,
    );
  });

  it('runs sync preview with init container and does not persist attempt', async () => {
    assignmentService.findOne.mockResolvedValue({
      id: 10,
      workerType: WorkerType.NODE_DEFAULT,
      assignmentTemplates: [{}],
    } as never);
    schedulingWorkerPreparationService.prepare.mockResolvedValue({
      files: { 'index.ts': 'console.log(1);' },
      dependencies: ['jest'],
    });
    workerService.createWorkerWithInitContainer.mockResolvedValue({
      passes: 3,
      failures: 1,
      completeTrace: 'trace',
    } as never);
    scorePolicyService.calculateScore.mockReturnValue(0.75);
    scorePolicyService.isAcceptable.mockReturnValue(false);

    const result = await service.createAndWait({
      assignmentId: 10,
      applicationFileContent: '',
      files: { 'index.ts': 'console.log(1);' },
    });

    expect(schedulingWorkerPreparationService.prepare).toHaveBeenCalled();
    expect(workerService.createWorkerWithInitContainer).toHaveBeenCalled();
    expect(workerService.createSynchronousWorker).not.toHaveBeenCalled();
    expect(attemptService.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      assignmentId: 10,
      isAcceptable: false,
      score: 0.75,
      report: 'trace',
      fails: 1,
      passes: 3,
    });
  });

  it('fails sync preview when assignment does not exist', async () => {
    assignmentService.findOne.mockResolvedValue(null);

    await expect(
      service.createAndWait({
        assignmentId: 999,
        applicationFileContent: '',
        files: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates async scheduling job and queues it', async () => {
    assignmentService.findOne.mockResolvedValue({
      id: 10,
      maxAttempts: 3,
    } as never);
    attemptService.isUserAbleToAttemptAssignment.mockResolvedValue(true);
    attemptService.findAllByAssignmentAndCurrentUser.mockResolvedValue([]);
    attemptService.create.mockResolvedValue({
      id: 25,
      assignmentId: 10,
      attempt: 1,
      status: AttemptStatus.PENDING,
    } as never);

    const result = await service.createSchedulingJobAsync({
      assignmentId: 10,
      applicationFileContent: '',
      files: { 'src/index.ts': 'content' },
    });

    expect(attemptService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignmentId: 10,
        attempt: 1,
        status: AttemptStatus.PENDING,
      }),
    );
    expect(schedulingQueue.add).toHaveBeenCalledWith(
      'process-scheduling-job',
      expect.objectContaining({
        attemptId: 25,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 25,
      }),
    );
  });

  it('rejects async scheduling when user cannot attempt', async () => {
    assignmentService.findOne.mockResolvedValue({
      id: 10,
      maxAttempts: 3,
    } as never);
    attemptService.isUserAbleToAttemptAssignment.mockResolvedValue(false);

    await expect(
      service.createSchedulingJobAsync({
        assignmentId: 10,
        applicationFileContent: '',
        files: {},
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('returns existing preview run when one is already active', async () => {
    assignmentService.findOne.mockResolvedValue({
      id: 10,
      workerType: WorkerType.NODE_DEFAULT,
    } as never);
    schedulingPreviewRunRepository.findOne.mockResolvedValue({
      id: 99,
      assignmentId: 10,
      userId: 42,
      status: 'running',
    } as never);

    const result = await service.createPreviewRun({
      assignmentId: 10,
      applicationFileContent: '',
      files: { 'src/index.ts': 'content' },
    });

    expect(schedulingPreviewRunRepository.save).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 99,
      }),
    );
  });
});
