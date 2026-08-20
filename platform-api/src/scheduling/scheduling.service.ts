import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { WorkerService } from 'src/worker/worker.service';
import { AttemptService } from 'src/attempt/attempt.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';
import { CreatePreviewJobMessageDto } from './dto/create-preview-job-message.dto';
import { plainToClass } from 'class-transformer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { ScorePolicyService } from './score-policy.service';
import { SchedulingAttemptTransitionService } from './scheduling-attempt-transition.service';
import {
  NoTemplatesForAssignmentError,
  NoTestFilesGeneratedError,
  SchedulingWorkerPreparationService,
} from './scheduling-worker-preparation.service';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { AiReportService } from 'src/ai-report/ai-report.abstract';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import {
  SchedulingPreviewRun,
  SchedulingPreviewRunStatus,
} from './entities/scheduling-preview-run.entity';
import { Repository, In } from 'typeorm';
import { RequestContextService } from 'src/request-context/request-context.service';
import { ExecutionEventPublisher } from 'src/execution/execution-event.publisher';
import { EXECUTION_COMMAND_QUEUE } from '@eevee/execution-contracts';

/**
 * Callback invoked by the scheduling processors whenever a queued job
 * transitions to a new status, so realtime consumers can be notified.
 */
export type SchedulingStatusReporter = (status: string) => Promise<void> | void;

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly workerService: WorkerService,
    private readonly attemptService: AttemptService,
    private readonly assignmentService: AssignmentService,
    private readonly scorePolicyService: ScorePolicyService,
    private readonly schedulingWorkerPreparationService: SchedulingWorkerPreparationService,
    private readonly schedulingAttemptTransitionService: SchedulingAttemptTransitionService,
    private readonly requestContextService: RequestContextService,
    private readonly aiReportService: AiReportService,
    private readonly executionEventPublisher: ExecutionEventPublisher,
    @InjectRepository(SchedulingPreviewRun)
    private readonly schedulingPreviewRunRepository: Repository<SchedulingPreviewRun>,
    @InjectQueue(EXECUTION_COMMAND_QUEUE) private readonly evaluationQueue: Queue,
    @InjectQueue('preview-queue') private readonly previewQueue: Queue,
    @InjectQueue('ai-report-queue') private readonly aiReportQueue: Queue,
  ) {}

  async createAndWait(createSchedulingDto: CreateSchedulingDto) {
    const assignment = await this.assignmentService.findOne(
      createSchedulingDto.assignmentId,
    );

    if (!assignment) throw new BadRequestException('Assignment not found');
    this.logger.debug({
      message: 'Assignment found',
      assignmentId: assignment.id,
    });

    this.logger.debug({
      message: 'Running worker synchronously for preview',
      workerType: assignment.workerType,
    });

    const workerResult = await this.prepareAndRunWorker({
      assignment,
      baseWorkerData: {
        ...createSchedulingDto,
      },
      jobName: `preview-assignment-${assignment.id}-${Date.now()}`,
    });
    if (!workerResult) {
      throw new BadRequestException('No test files available for execution.');
    }

    this.logger.debug({
      message: 'Worker execution completed',
      assignmentId: assignment.id,
    });

    const score = this.scorePolicyService.calculateScore(workerResult);
    const isAcceptable = this.scorePolicyService.isAcceptable(score);

    return {
      assignmentId: createSchedulingDto.assignmentId,
      isAcceptable,
      score,
      report: workerResult.completeTrace,
      fails: workerResult.failures,
      passes: workerResult.passes,
    };
  }

  async createSchedulingJobAsync(createSchedulingDto: CreateSchedulingDto) {
    this.logger.debug({
      message: 'Creating scheduling job asynchronously',
      createSchedulingDto,
    });

    const assignment = await this.assignmentService.findOne(
      createSchedulingDto.assignmentId,
    );
    if (!assignment) throw new BadRequestException('Assignment not found');

    const isUserAbleToAttempt =
      await this.attemptService.isUserAbleToAttemptAssignment(
        createSchedulingDto.assignmentId,
      );
    if (!isUserAbleToAttempt)
      throw new UnprocessableEntityException(
        'User is not able to attempt this assignment',
      );

    const currentAssignmentsUserAttempts =
      await this.attemptService.findAllByAssignmentAndCurrentUser(
        createSchedulingDto.assignmentId,
      );

    if (
      assignment.maxAttempts &&
      this.isUserReachedMaxAttempt(
        assignment.maxAttempts,
        currentAssignmentsUserAttempts.length,
      )
    ) {
      throw new BadRequestException('Max attempts reached');
    }

    this.logger.log('Sending scheduling job to BullMQ');

    const workerData = await this.schedulingWorkerPreparationService.prepare({
      assignment,
      baseWorkerData: plainToClass(CreateWorkerDto, {
        files: createSchedulingDto.files,
        applicationFileContent: createSchedulingDto.applicationFileContent,
      }),
    });

    const newAttempt = await this.attemptService.create({
      assignmentId: createSchedulingDto.assignmentId,
      attempt: currentAssignmentsUserAttempts.length + 1,
      isAcceptable: false,
      score: 0,
      report: '',
      fails: 0,
      passes: 0,
      status: AttemptStatus.PENDING,
      receivedWork: createSchedulingDto.files ?? undefined,
    });

    const message = plainToClass(CreateSchedulingJobMessageDto, {
      attemptId: newAttempt.id,
      userId: newAttempt.userId,
      workerType: assignment.workerType,
      workerData,
    });

    await this.evaluationQueue.add('evaluate-code', message);

    this.logger.log(`Scheduling job created with attempt ID: ${newAttempt.id}`);

    return newAttempt;
  }

  async createPreviewRun(createSchedulingDto: CreateSchedulingDto) {
    const assignment = await this.assignmentService.findOne(
      createSchedulingDto.assignmentId,
    );
    if (!assignment) {
      throw new BadRequestException('Assignment not found');
    }

    const user = this.requestContextService.getUser();

    const existingPreviewRun =
      await this.schedulingPreviewRunRepository.findOne({
        where: {
          userId: user.userId,
          assignmentId: createSchedulingDto.assignmentId,
          status: In([
            SchedulingPreviewRunStatus.PENDING,
            SchedulingPreviewRunStatus.RUNNING,
          ]),
        },
        order: {
          createdAt: 'DESC',
        },
      });

    if (existingPreviewRun) {
      return existingPreviewRun;
    }

    const previewRun = await this.schedulingPreviewRunRepository.save({
      userId: user.userId,
      assignmentId: createSchedulingDto.assignmentId,
      status: SchedulingPreviewRunStatus.PENDING,
      report: '',
    });

    const message = plainToClass(CreatePreviewJobMessageDto, {
      previewRunId: previewRun.id,
      userId: user.userId,
      createSchedulingDto,
    });

    await this.previewQueue.add('process-preview-job', message, {
      jobId: `preview-run-${previewRun.id}`,
    });

    this.logger.log(
      `Preview job created with preview run ID: ${previewRun.id}`,
    );

    return previewRun;
  }

  async getPreviewRunForCurrentUser(previewRunId: number) {
    const user = this.requestContextService.getUser();

    return this.schedulingPreviewRunRepository.findOne({
      where: {
        id: previewRunId,
        userId: user.userId,
      },
    });
  }

  async cancelPreviewRun(previewRunId: number) {
    const previewRun = await this.getPreviewRunForCurrentUser(previewRunId);
    if (!previewRun) {
      throw new BadRequestException('Preview run not found');
    }

    if (
      ![
        SchedulingPreviewRunStatus.PENDING,
        SchedulingPreviewRunStatus.RUNNING,
      ].includes(previewRun.status)
    ) {
      return previewRun;
    }

    if (previewRun.jobName) {
      await this.workerService.cancelWorkerJob(previewRun.jobName);
    }

    await this.schedulingPreviewRunRepository.update(previewRun.id, {
      status: SchedulingPreviewRunStatus.CANCELLED,
      errorMessage: 'Preview run cancelled by user',
      completedAt: new Date(),
    });

    return this.getPreviewRunForCurrentUser(previewRunId);
  }

  async retryAttemptFromAdmin(attemptId: number) {
    const originalAttempt = await this.attemptService.findOne(attemptId);
    if (!originalAttempt) {
      throw new BadRequestException('Attempt not found');
    }

    if (!originalAttempt.receivedWork) {
      throw new BadRequestException(
        'Attempt does not have stored submission files for retry',
      );
    }

    const nextAttemptNumber = await this.attemptService.getNextAttemptNumber(
      originalAttempt.assignmentId,
      originalAttempt.userId,
    );

    const newAttempt = await this.attemptService.createForUser(
      {
        assignmentId: originalAttempt.assignmentId,
        attempt: nextAttemptNumber,
        isAcceptable: false,
        score: 0,
        report: '',
        fails: 0,
        passes: 0,
        status: AttemptStatus.PENDING,
        receivedWork: originalAttempt.receivedWork,
      },
      originalAttempt.userId,
    );

    const workerData = plainToClass(CreateWorkerDto, {
      files: originalAttempt.receivedWork,
      applicationFileContent: '',
    });

    const preparedWorkerData = await this.schedulingWorkerPreparationService.prepare({
      assignment: originalAttempt.assignment,
      baseWorkerData: workerData,
      attemptId: newAttempt.id,
    });

    const message = plainToClass(CreateSchedulingJobMessageDto, {
      attemptId: newAttempt.id,
      userId: originalAttempt.userId,
      workerType: originalAttempt.assignment.workerType,
      workerData: preparedWorkerData,
    });

    await this.evaluationQueue.add('evaluate-code', message);

    this.logger.log(
      `Retry scheduling job created with attempt ID: ${newAttempt.id} from original attempt ID: ${originalAttempt.id}`,
    );

    return newAttempt;
  }

  /**
   * Processes a scheduling job message.
   *
   * @param payload - The message containing the scheduling job details.
   */
  async processJobAndWait(
    payload: CreateSchedulingJobMessageDto,
    onStatus?: SchedulingStatusReporter,
  ) {
    const { attemptId } = payload;
    this.logger.log(`Processing scheduling job for attempt ID: ${attemptId}`);

    const attempt = await this.attemptService.findOne(attemptId);
    if (!attempt) {
      this.logger.fatal(
        `Attempt with ID ${attemptId} not found in job processing`,
      );
      return;
    }

    if (attempt.status !== AttemptStatus.PENDING) {
      this.logger.warn(
        `Attempt with ID ${attemptId} has status ${attempt.status} and will not be processed`,
      );
      return;
    }

    this.logger.log(
      `Found attempt: ${JSON.stringify(attempt)}`,
      `ATTEMPT_ID: ${attempt.id}`,
    );

    await this.executionEventPublisher.publishStarted(attempt.id, attempt.userId);

    try {
      const workerResult = await this.prepareAndRunWorker({
        assignment: attempt.assignment,
        baseWorkerData: {
          ...payload.workerData,
        },
        attemptId: attempt.id,
        jobName: `attempt-${attempt.id}-worker`,
      });
      if (!workerResult) {
        await this.executionEventPublisher.publishFailed(
          attempt.id,
          attempt.userId,
          'No test files available for execution.',
        );
        return;
      }

      this.logger.log(
        `Worker result: ${JSON.stringify(workerResult)}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );

      const score = this.scorePolicyService.calculateScore(workerResult);
      const isAcceptable = this.scorePolicyService.isAcceptable(score);

      this.logger.log(
        `Score: ${score}, Is Acceptable: ${isAcceptable}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );

      await this.executionEventPublisher.publishCompleted(
        attempt.id,
        attempt.userId,
        {
          isAcceptable,
          score,
          report: workerResult.completeTrace,
          fails: workerResult.failures,
          passes: workerResult.passes,
        },
      );

      this.logger.log(
        `Attempt updated successfully with status: ${AttemptStatus.COMPLETED}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unknown error';

      this.logger.fatal(
        `Worker creation failed for attempt ID ${attempt.id}: ${errMessage}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );

      await this.executionEventPublisher.publishFailed(
        attempt.id,
        attempt.userId,
        errMessage,
      );
    }
  }

  async requestAiFeedback(attemptId: number): Promise<void> {
    const user = this.requestContextService.getUser();
    const attempt = await this.attemptService.findOne(attemptId);

    if (!attempt || attempt.userId !== user.userId) {
      throw new NotFoundException('Attempt not found');
    }
    if (attempt.status !== AttemptStatus.COMPLETED) {
      throw new BadRequestException('Attempt is not completed');
    }
    if (attempt.refinedReport) return;

    await this.aiReportQueue.add(
      'process-ai-report-job',
      { attemptId },
      { jobId: `ai-report-${attemptId}` },
    );
  }

  async getAiFeedback(attemptId: number): Promise<string | null> {
    const user = this.requestContextService.getUser();
    return this.attemptService.findRefinedReport(attemptId, user.userId);
  }

  async processAiReportJob(attemptId: number): Promise<void> {
    const attempt = await this.attemptService.findOne(attemptId);
    if (!attempt || attempt.status !== AttemptStatus.COMPLETED) return;
    if (attempt.refinedReport) return;

    const refinedReport = await this.generateRefinedReport(
      attempt.report,
      attempt.assignment?.description ?? '',
      attempt.receivedWork ?? undefined,
      attempt.assignment?.workerType,
    );

    if (refinedReport) {
      await this.attemptService.update({ id: attemptId, refinedReport });
    }
  }

  private isUserReachedMaxAttempt(maxAttempts: number, currentAttemps: number) {
    return maxAttempts <= currentAttemps;
  }

  private async prepareAndRunWorker(params: {
    assignment: Assignment;
    baseWorkerData: CreateWorkerDto;
    jobName: string;
    attemptId?: number;
  }): Promise<WorkerResponse | null> {
    const { assignment, baseWorkerData, attemptId, jobName } = params;

    let workerData: CreateWorkerDto;
    try {
      workerData = await this.schedulingWorkerPreparationService.prepare({
        assignment,
        baseWorkerData,
        attemptId,
      });
    } catch (error) {
      if (
        error instanceof NoTemplatesForAssignmentError ||
        error instanceof NoTestFilesGeneratedError
      ) {
        if (attemptId) {
          this.logger.fatal(error.message, `ATTEMPT_ID: ${attemptId}`);
          return null;
        }

        throw new BadRequestException('No test files available for execution.');
      }

      throw error;
    }

    if (!workerData) {
      return null;
    }

    return this.workerService.createWorkerWithInitContainer(
      jobName,
      assignment.workerType,
      workerData,
    );
  }

  private async generateRefinedReport(
    rawReport: string,
    assignmentDescription: string,
    files?: Record<string, string>,
    workerType?: WorkerType,
  ): Promise<string | undefined> {
    try {
      return await this.aiReportService.refineReport(
        rawReport,
        assignmentDescription,
        files,
        workerType,
      );
    } catch (error) {
      this.logger.error(
        `AI report generation failed: ${error instanceof Error ? error.message : error}`,
      );
      return undefined;
    }
  }

  async processPreviewJob(
    payload: CreatePreviewJobMessageDto,
    onStatus?: SchedulingStatusReporter,
  ) {
    const { previewRunId, createSchedulingDto } = payload;
    this.logger.log(
      `Processing preview job for preview run ID: ${previewRunId}`,
    );

    const assignment = await this.assignmentService.findOneForExecution(
      createSchedulingDto.assignmentId,
    );
    if (!assignment) {
      this.logger.fatal(
        `Assignment ${createSchedulingDto.assignmentId} not found for preview run ${previewRunId}`,
      );
      await this.schedulingPreviewRunRepository.update(
        {
          id: previewRunId,
          status: SchedulingPreviewRunStatus.PENDING,
        },
        {
          status: SchedulingPreviewRunStatus.FAILED,
          errorMessage: 'Assignment not found',
          completedAt: new Date(),
        },
      );
      await onStatus?.(SchedulingPreviewRunStatus.FAILED);
      return;
    }

    await this.processPreviewRun(
      previewRunId,
      assignment,
      createSchedulingDto,
      onStatus,
    );
  }

  private async processPreviewRun(
    previewRunId: number,
    assignment: Assignment,
    createSchedulingDto: CreateSchedulingDto,
    onStatus?: SchedulingStatusReporter,
  ) {
    const jobName = `preview-run-${previewRunId}-worker`;

    const startPreviewRunResult =
      await this.schedulingPreviewRunRepository.update(
        {
          id: previewRunId,
          status: SchedulingPreviewRunStatus.PENDING,
        },
        {
          status: SchedulingPreviewRunStatus.RUNNING,
          jobName,
          errorMessage: undefined,
        },
      );

    if (!startPreviewRunResult.affected) {
      this.logger.warn(
        `Preview run ${previewRunId} was not started because it is no longer pending`,
      );
      return;
    }

    await onStatus?.(SchedulingPreviewRunStatus.RUNNING);

    try {
      const workerResult = await this.prepareAndRunWorker({
        assignment,
        baseWorkerData: {
          ...createSchedulingDto,
        },
        jobName,
      });

      if (!workerResult) {
        await this.schedulingPreviewRunRepository.update(previewRunId, {
          status: SchedulingPreviewRunStatus.FAILED,
          errorMessage: 'No test files available for execution.',
          completedAt: new Date(),
        });
        await onStatus?.(SchedulingPreviewRunStatus.FAILED);
        return;
      }

      const score = this.scorePolicyService.calculateScore(workerResult);
      const isAcceptable = this.scorePolicyService.isAcceptable(score);

      await this.schedulingPreviewRunRepository.update(
        {
          id: previewRunId,
          status: SchedulingPreviewRunStatus.RUNNING,
        },
        {
          status: SchedulingPreviewRunStatus.COMPLETED,
          isAcceptable,
          score,
          report: workerResult.completeTrace,
          fails: workerResult.failures,
          passes: workerResult.passes,
          completedAt: new Date(),
        },
      );
      await onStatus?.(SchedulingPreviewRunStatus.COMPLETED);
    } catch (error) {
      const previewRun = await this.schedulingPreviewRunRepository.findOne({
        where: { id: previewRunId },
      });

      if (previewRun?.status === SchedulingPreviewRunStatus.CANCELLED) {
        await onStatus?.(SchedulingPreviewRunStatus.CANCELLED);
        return;
      }

      await this.schedulingPreviewRunRepository.update(
        {
          id: previewRunId,
          status: SchedulingPreviewRunStatus.RUNNING,
        },
        {
          status: SchedulingPreviewRunStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : 'Preview run failed',
          completedAt: new Date(),
        },
      );
      await onStatus?.(SchedulingPreviewRunStatus.FAILED);
    }
  }
}
