import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { AttemptService } from 'src/attempt/attempt.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { plainToClass } from 'class-transformer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { ScorePolicyService } from './score-policy.service';
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
import { ExecutionRequestService } from 'src/execution/execution-request.service';
import { EXECUTION_COMMAND_QUEUE, ExecutionCommand } from '@eevee/execution-contracts';
import { AssignmentAlertService } from 'src/assignment-alert/assignment-alert.service';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly executionRequestService: ExecutionRequestService,
    private readonly attemptService: AttemptService,
    private readonly assignmentService: AssignmentService,
    private readonly scorePolicyService: ScorePolicyService,
    private readonly schedulingWorkerPreparationService: SchedulingWorkerPreparationService,
    private readonly requestContextService: RequestContextService,
    private readonly aiReportService: AiReportService,
    @InjectRepository(SchedulingPreviewRun)
    private readonly schedulingPreviewRunRepository: Repository<SchedulingPreviewRun>,
    @InjectQueue(EXECUTION_COMMAND_QUEUE) private readonly evaluationQueue: Queue,
    @InjectQueue('ai-report-queue') private readonly aiReportQueue: Queue,
    private readonly assignmentAlertService: AssignmentAlertService,
  ) {}

  async createAndWait(createSchedulingDto: CreateSchedulingDto) {
    await this.assignmentAlertService.assertCurrentUserNotSuspended(createSchedulingDto.assignmentId);

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

    await this.assignmentAlertService.assertCurrentUserNotSuspended(createSchedulingDto.assignmentId);
    const assignment = await this.assignmentService.findOne(
      createSchedulingDto.assignmentId,
    );
    if (!assignment) throw new BadRequestException('Assignment not found');

    await this.assignmentService.assertSubmissionOpen(assignment.id);

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

    const message: ExecutionCommand = {
      target: { kind: 'attempt', id: newAttempt.id, userId: newAttempt.userId },
      jobName: `attempt-${newAttempt.id}-worker`,
      workerType: assignment.workerType,
      workerData,
    };

    await this.evaluationQueue.add('evaluate-code', message);

    this.logger.log(`Scheduling job created with attempt ID: ${newAttempt.id}`);

    return newAttempt;
  }

  async createPreviewRun(createSchedulingDto: CreateSchedulingDto) {
    await this.assignmentAlertService.assertCurrentUserNotSuspended(createSchedulingDto.assignmentId);

    const assignment = await this.assignmentService.findOne(createSchedulingDto.assignmentId);

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

    const jobName = `preview-run-${previewRun.id}-worker`;
    try {
      const workerData = await this.schedulingWorkerPreparationService.prepare({
        assignment,
        baseWorkerData: { ...createSchedulingDto },
      });
      const message: ExecutionCommand = {
        target: { kind: 'preview', id: previewRun.id, userId: user.userId },
        jobName,
        workerType: assignment.workerType,
        workerData,
      };

      await this.schedulingPreviewRunRepository.update(previewRun.id, { jobName });
      await this.evaluationQueue.add('evaluate-code', message);
    } catch (error) {
      await this.schedulingPreviewRunRepository.update(previewRun.id, {
        status: SchedulingPreviewRunStatus.FAILED,
        errorMessage:
          error instanceof Error ? error.message : 'Preview preparation failed',
        completedAt: new Date(),
      });
    }

    this.logger.log(
      `Preview job created with preview run ID: ${previewRun.id}`,
    );

    return previewRun;
  }

  async getPreviewRunForCurrentUser(previewRunId: number) {
    const user = this.requestContextService.getUser();

    const previewRun = await this.schedulingPreviewRunRepository.findOne({
      where: {
        id: previewRunId,
        userId: user.userId,
      },
    });

    if (previewRun) {
      await this.assignmentAlertService.assertCurrentUserNotSuspended(previewRun.assignmentId);
    }
    return previewRun;
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
      await this.executionRequestService.cancel(previewRun.jobName);
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

    const message: ExecutionCommand = {
      target: {
        kind: 'attempt',
        id: newAttempt.id,
        userId: originalAttempt.userId,
      },
      jobName: `attempt-${newAttempt.id}-worker`,
      workerType: originalAttempt.assignment.workerType,
      workerData: preparedWorkerData,
    };

    await this.evaluationQueue.add('evaluate-code', message);

    this.logger.log(
      `Retry scheduling job created with attempt ID: ${newAttempt.id} from original attempt ID: ${originalAttempt.id}`,
    );

    return newAttempt;
  }

  async requestAiFeedback(attemptId: number): Promise<void> {
    const user = this.requestContextService.getUser();
    const attempt = await this.attemptService.findOne(attemptId);

    if (!attempt || attempt.userId !== user.userId) {
      throw new NotFoundException('Attempt not found');
    }
    await this.assignmentAlertService.assertCurrentUserNotSuspended(attempt.assignmentId);
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
    const attempt = await this.attemptService.findOne(attemptId);

    if (!attempt || attempt.userId !== user.userId) throw new NotFoundException('Attempt not found')

    await this.assignmentAlertService.assertCurrentUserNotSuspended(attempt.assignmentId);
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

    return this.executionRequestService.execute({
      jobName,
      workerType: assignment.workerType,
      workerData,
    });
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

}
