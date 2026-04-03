import {
  BadRequestException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { WorkerService } from 'src/worker/worker.service';
import { AttemptService } from 'src/attempt/attempt.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';
import { plainToClass } from 'class-transformer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ScorePolicyService } from './score-policy.service';
import { SchedulingAttemptTransitionService } from './scheduling-attempt-transition.service';
import {
  NoTemplatesForAssignmentError,
  NoTestFilesGeneratedError,
  SchedulingWorkerPreparationService,
} from './scheduling-worker-preparation.service';

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
    @InjectQueue('scheduling-queue') private readonly schedulingQueue: Queue,
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

    const previousAttempts =
      await this.attemptService.findAllByAssignmentAndCurrentUser(
        createSchedulingDto.assignmentId,
      );

    if (
      assignment.maxAttempts &&
      previousAttempts.length >= assignment.maxAttempts
    ) {
      throw new BadRequestException('Max attempts reached');
    }

    this.logger.debug({
      message: 'Creating worker and waiting for result',
      workerType: assignment.workerType,
    });

    let workerData: CreateWorkerDto;
    try {
      workerData = await this.schedulingWorkerPreparationService.prepare({
        assignment,
        baseWorkerData: {
          ...createSchedulingDto,
        },
      });
    } catch (error) {
      if (
        error instanceof NoTemplatesForAssignmentError ||
        error instanceof NoTestFilesGeneratedError
      ) {
        throw new BadRequestException('No test files available for execution.');
      }

      throw error;
    }

    const workerResult = await this.workerService.createSynchronousWorker(
      assignment.workerType,
      workerData,
      workerData.dependencies ?? [],
    );

    this.logger.debug({
      message: 'Worker execution completed',
      attemptCount: previousAttempts.length + 1,
    });

    const score = this.scorePolicyService.calculateScore(workerResult);
    const isAcceptable = this.scorePolicyService.isAcceptable(score);

    const result = await this.attemptService.create({
      assignmentId: createSchedulingDto.assignmentId,
      attempt: previousAttempts.length + 1,
      isAcceptable,
      score,
      report: workerResult.completeTrace,
      fails: workerResult.failures,
      passes: workerResult.passes,
      status: AttemptStatus.COMPLETED,
      receivedWork: workerData.files ?? undefined,
    });

    return result;
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

    const workerData = plainToClass(CreateWorkerDto, {
      files: createSchedulingDto.files,
      applicationFileContent: createSchedulingDto.applicationFileContent,
    });

    const message = plainToClass(CreateSchedulingJobMessageDto, {
      attemptId: newAttempt.id,
      workerData,
    });

    await this.schedulingQueue.add('process-scheduling-job', message);

    this.logger.log(`Scheduling job created with attempt ID: ${newAttempt.id}`);

    return newAttempt;
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

    const message = plainToClass(CreateSchedulingJobMessageDto, {
      attemptId: newAttempt.id,
      workerData,
    });

    await this.schedulingQueue.add('process-scheduling-job', message);

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
  async processJobAndWait(payload: CreateSchedulingJobMessageDto) {
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

    await this.schedulingAttemptTransitionService.markRunning(attempt.id);

    let workerData: CreateWorkerDto;
    try {
      workerData = await this.schedulingWorkerPreparationService.prepare({
        assignment: attempt.assignment,
        baseWorkerData: {
          ...payload.workerData,
        },
        attemptId: attempt.id,
      });
    } catch (error) {
      if (
        error instanceof NoTemplatesForAssignmentError ||
        error instanceof NoTestFilesGeneratedError
      ) {
        this.logger.fatal(error.message, `ATTEMPT_ID: ${attempt.id}`);
        await this.schedulingAttemptTransitionService.markFailedNoTests(
          attempt.id,
        );
        return;
      }

      throw error;
    }

    try {
      const jobName = `attempt-${attempt.id}-worker`;

      const workerResult =
        await this.workerService.createWorkerWithInitContainer(
          jobName,
          attempt.assignment.workerType,
          workerData,
        );

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

      await this.schedulingAttemptTransitionService.markCompleted({
        attemptId: attempt.id,
        isAcceptable,
        score,
        report: workerResult.completeTrace,
        fails: workerResult.failures,
        passes: workerResult.passes,
      });

      this.logger.log(
        `Attempt updated successfully with status: ${AttemptStatus.COMPLETED}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );
    } catch (err) {
      this.logger.fatal(
        `Worker creation failed for attempt ID ${attempt.id}: ${err.message}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );

      await this.schedulingAttemptTransitionService.markFailedWorkerError(
        attempt.id,
        err.message,
      );

      throw err;
    }
  }

  private isUserReachedMaxAttempt(maxAttempts: number, currentAttemps: number) {
    return maxAttempts <= currentAttemps;
  }
}
