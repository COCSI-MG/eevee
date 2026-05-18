import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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
import {
  SchedulingPreviewRun,
  SchedulingPreviewRunStatus,
} from './entities/scheduling-preview-run.entity';
import { Repository } from 'typeorm';
import { AiReportService } from 'src/ai-report/ai-report.abstract';

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
      | 'findRefinedReport'
      | 'update'
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
  let aiReportService: jest.Mocked<Pick<AiReportService, 'refineReport'>>;
  let aiReportQueue: jest.Mocked<Pick<Queue, 'add'>>;

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
      findRefinedReport: jest.fn(),
      update: jest.fn(),
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

    aiReportService = {
      refineReport: jest.fn().mockResolvedValue(''),
    };

    aiReportQueue = {
      add: jest.fn(),
    };

    service = new SchedulingService(
      workerService as unknown as WorkerService,
      attemptService as unknown as AttemptService,
      assignmentService as unknown as AssignmentService,
      scorePolicyService as unknown as ScorePolicyService,
      schedulingWorkerPreparationService as unknown as SchedulingWorkerPreparationService,
      schedulingAttemptTransitionService as unknown as SchedulingAttemptTransitionService,
      requestContextService as unknown as RequestContextService,
      aiReportService as unknown as AiReportService,
      schedulingPreviewRunRepository as unknown as Repository<SchedulingPreviewRun>,
      schedulingQueue as unknown as Queue,
      aiReportQueue as unknown as Queue,
    );

    jest.spyOn((service as any).logger, 'debug').mockImplementation(() => {});
    jest.spyOn((service as any).logger, 'log').mockImplementation(() => {});
    jest.spyOn((service as any).logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

  it('does not start a preview worker when the run is no longer pending', async () => {
    schedulingPreviewRunRepository.update.mockResolvedValue({
      affected: 0,
    } as never);

    await (service as any).processPreviewRun(
      77,
      {
        id: 10,
        workerType: WorkerType.NODE_DEFAULT,
      },
      {
        assignmentId: 10,
        applicationFileContent: '',
        files: { 'src/index.ts': 'content' },
      },
    );

    expect(schedulingPreviewRunRepository.update).toHaveBeenCalledWith(
      {
        id: 77,
        status: SchedulingPreviewRunStatus.PENDING,
      },
      expect.objectContaining({
        status: SchedulingPreviewRunStatus.RUNNING,
        jobName: 'preview-run-77-worker',
      }),
    );
    expect(schedulingWorkerPreparationService.prepare).not.toHaveBeenCalled();
    expect(workerService.createWorkerWithInitContainer).not.toHaveBeenCalled();
  });

  it('does not overwrite a cancelled preview run with completed status', async () => {
    schedulingPreviewRunRepository.update
      .mockResolvedValueOnce({
        affected: 1,
      } as never)
      .mockResolvedValueOnce({
        affected: 0,
      } as never);
    schedulingWorkerPreparationService.prepare.mockResolvedValue({
      files: { 'index.ts': 'console.log(1);' },
    });
    workerService.createWorkerWithInitContainer.mockResolvedValue({
      passes: 3,
      failures: 1,
      completeTrace: 'trace',
    } as never);
    scorePolicyService.calculateScore.mockReturnValue(0.75);
    scorePolicyService.isAcceptable.mockReturnValue(false);

    await (service as any).processPreviewRun(
      78,
      {
        id: 10,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentTemplates: [{}],
      },
      {
        assignmentId: 10,
        applicationFileContent: '',
        files: { 'src/index.ts': 'content' },
      },
    );

    expect(schedulingPreviewRunRepository.update).toHaveBeenNthCalledWith(
      2,
      {
        id: 78,
        status: SchedulingPreviewRunStatus.RUNNING,
      },
      expect.objectContaining({
        status: SchedulingPreviewRunStatus.COMPLETED,
        report: 'trace',
      }),
    );
  });

  it('throws NotFoundException for requestAiFeedback when attempt not found', async () => {
    attemptService.findOne.mockResolvedValue(null);

    await expect(service.requestAiFeedback(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(aiReportQueue.add).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for requestAiFeedback when attempt is not completed', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 1,
      userId: 42,
      status: AttemptStatus.RUNNING,
    } as never);

    await expect(service.requestAiFeedback(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(aiReportQueue.add).not.toHaveBeenCalled();
  });

  it('returns without queuing for requestAiFeedback when refinedReport already exists', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 1,
      userId: 42,
      status: AttemptStatus.COMPLETED,
      refinedReport: 'existing feedback',
    } as never);

    await service.requestAiFeedback(1);

    expect(aiReportQueue.add).not.toHaveBeenCalled();
  });

  it('queues AI report job for requestAiFeedback when attempt is completed without refinedReport', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 1,
      userId: 42,
      status: AttemptStatus.COMPLETED,
      refinedReport: null,
    } as never);

    await service.requestAiFeedback(1);

    expect(aiReportQueue.add).toHaveBeenCalledWith(
      'process-ai-report-job',
      { attemptId: 1 },
      { jobId: 'ai-report-1' },
    );
  });

  it('generates and saves refinedReport in processAiReportJob', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 10,
      status: AttemptStatus.COMPLETED,
      refinedReport: null,
      report: 'raw report',
      assignment: { description: 'desc' },
      receivedWork: { 'index.ts': 'code' },
    } as never);
    aiReportService.refineReport.mockResolvedValue('refined feedback');

    await service.processAiReportJob(10);

    expect(aiReportService.refineReport).toHaveBeenCalledWith(
      'raw report',
      'desc',
      { 'index.ts': 'code' },
      undefined,
    );
    expect(attemptService.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, refinedReport: 'refined feedback' }),
    );
  });

  it('does not save when AI generation fails in processAiReportJob', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 10,
      status: AttemptStatus.COMPLETED,
      refinedReport: null,
      report: 'raw report',
      assignment: { description: 'desc' },
    } as never);
    aiReportService.refineReport.mockRejectedValue(new Error('AI error'));

    await service.processAiReportJob(10);

    expect(attemptService.update).not.toHaveBeenCalled();
  });

  it('marks attempt as failed worker error without rethrowing', async () => {
    attemptService.findOne.mockResolvedValue({
      id: 31,
      assignment: {
        id: 10,
        workerType: WorkerType.NODE_DEFAULT,
        assignmentTemplates: [{}],
      },
      status: AttemptStatus.PENDING,
    } as never);

    schedulingWorkerPreparationService.prepare.mockRejectedValue(
      new Error('worker crash'),
    );

    await expect(
      service.processJobAndWait({
        attemptId: 31,
        workerData: {
          applicationFileContent: '',
          files: { 'src/index.ts': 'content' },
        },
      }),
    ).resolves.toBeUndefined();

    expect(schedulingAttemptTransitionService.markRunning).toHaveBeenCalledWith(
      31,
    );
    expect(
      schedulingAttemptTransitionService.markFailedWorkerError,
    ).toHaveBeenCalledWith(31, 'worker crash');
  });
});
