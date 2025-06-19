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
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { ProducerService } from 'src/kafka/producer.service';
import { SCHEDULING_CREATE_JOB_TOPIC } from './constants';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { Cron, Interval } from '@nestjs/schedule';
import { readFileAsString } from 'src/utils/template.utils';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  /**
   * Map of worker types to their corresponding worker creation functions.
   * This allows for dynamic worker creation based on the worker type specified in the assignment.
   */
  readonly workerMap = new Map<
    WorkerType,
    (createWorkerData: CreateWorkerDto) => Promise<WorkerResponse>
  >();

  constructor(
    workerService: WorkerService,
    private readonly attemptService: AttemptService,
    private readonly assignmentService: AssignmentService,
    private readonly producerService: ProducerService,
  ) {
    this.workerMap.set(
      WorkerType.NODE_DEFAULT,
      workerService.createDefaultNodeWorkerAndWait.bind(workerService),
    );
    this.workerMap.set(
      WorkerType.NODE_NESTJS,
      workerService.createNestJsWorkerAndWait.bind(workerService),
    );
  }

  private calculateScore(result: WorkerResponse) {
    return result.passes / (result.passes + result.failures || 1);
  }

  private checkIfResultIsAcceptable(score: number) {
    return score >= 0.7;
  }

  async createAndWait(createSchedulingDto: CreateSchedulingDto) {
    const assignment = await this.assignmentService.findOne(
      createSchedulingDto.assignmentId,
    );

    if (!assignment) throw new BadRequestException('Assignment not found');

    console.log('Assignment:', assignment);

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

    console.log('Creating worker and waiting for result');
    console.log('Worker type:', assignment.workerType);

    const createWorkerAndWait = this.workerMap.get(assignment?.workerType)!;

    const filledTemplates = await Promise.all(
      assignment.assignmentTemplates.map(async (templateRelation) => {
        let content = await readFileAsString(
          templateRelation.template.filePath,
        );

        for (const param of templateRelation.template.templateParams) {
          const paramValue =
            assignment.assignmentParams.find(
              (p) => p.templateParamsId === param.id,
            )?.value ?? '';
          content = content.replace(
            new RegExp(`\\$${param.name}\\$`, 'g'),
            paramValue,
          );
        }
        return content;
      }),
    );
    createSchedulingDto.testFilesContent = filledTemplates;

    const workerResult = await createWorkerAndWait(createSchedulingDto);

    console.log('Worker result:', workerResult);

    const score = this.calculateScore(workerResult);
    const isAcceptable = this.checkIfResultIsAcceptable(score);

    const result = await this.attemptService.create({
      assignmentId: createSchedulingDto.assignmentId,
      attempt: previousAttempts.length + 1,
      isAcceptable,
      score,
      report: workerResult.completeTrace,
      fails: workerResult.failures,
      passes: workerResult.passes,
      status: AttemptStatus.COMPLETED,
    });

    return result;
  }

  async createSchedulingJobAsync(createSchedulingDto: CreateSchedulingDto) {
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

    this.logger.log('Sending scheduling job to Kafka');

    const currentAssignmentsUserAttempts =
      await this.attemptService.findAllByAssignmentAndCurrentUser(
        createSchedulingDto.assignmentId,
      );

    const newAttempt = await this.attemptService.create({
      assignmentId: createSchedulingDto.assignmentId,
      attempt: currentAssignmentsUserAttempts.length + 1,
      isAcceptable: false,
      score: 0,
      report: '',
      fails: 0,
      passes: 0,
      status: AttemptStatus.PENDING,
    });

    const message: CreateSchedulingJobMessage = {
      attemptId: newAttempt.id,
      applicationFileContent: createSchedulingDto.applicationFileContent,
    };

    await this.producerService.produce(SCHEDULING_CREATE_JOB_TOPIC, {
      key: crypto.randomUUID(),
      value: JSON.stringify(message),
    });

    this.logger.log(`Scheduling job created with attempt ID: ${newAttempt.id}`);
  }

  async produceSchedulingJobTest() {
    this.logger.log('Producing scheduling job test message');

    const message: CreateSchedulingJobMessage = {
      attemptId: 2, // This should be replaced with a valid attempt ID
      applicationFileContent: 'Test content for scheduling job',
    };

    await this.producerService.produce(SCHEDULING_CREATE_JOB_TOPIC, {
      key: crypto.randomUUID(),
      value: JSON.stringify(message),
    });

    this.logger.log('Scheduling job test message produced');
  }

  /**
   * Processes a scheduling job message.
   *
   * @param message - The message containing the scheduling job details.
   */
  async ProcessJobAndWait(message: CreateSchedulingJobMessage) {
    this.logger.log(
      `Processing scheduling job for attempt ID: ${message.attemptId}`,
    );

    const attempt = await this.attemptService.findOne(message.attemptId);
    if (!attempt) {
      this.logger.fatal(
        `Attempt with ID ${message.attemptId} not found in job processing`,
      );
      return;
    }

    this.logger.log(
      `Found attempt: ${JSON.stringify(attempt)}`,
      `ATTEMPT_ID: ${attempt.id}`,
    );

    await this.attemptService.update({
      id: attempt.id,
      status: AttemptStatus.RUNNING,
    });

    if (
      attempt.assignment.assignmentTemplates !== undefined &&
      attempt.assignment.assignmentTemplates.length === 0
    ) {
      this.logger.error(
        `No templates found for assignment ID ${attempt.assignmentId}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );
      this.attemptService.update({
        id: attempt.id,
        status: AttemptStatus.FAILED,
      });
      return;
    }

    const filledTemplates = await this.assignmentService.getAssignmentTemplates(
      attempt.assignment,
    );

    const createSchedulingDto: CreateSchedulingDto = {
      assignmentId: attempt.assignmentId,
      testFilesContent: filledTemplates,
      applicationFileContent: message.applicationFileContent,
    };

    const createWorkerAndWait = this.workerMap.get(
      attempt.assignment.workerType,
    );
    if (!createWorkerAndWait) {
      this.logger.error(
        `Worker type ${attempt.assignment.workerType} not found`,
        `ATTEMPT_ID: ${attempt.id}`,
      );
      this.attemptService.update({
        id: attempt.id,
        attempt: attempt.attempt - 1,
        status: AttemptStatus.FAILED,
      });
      return;
    }

    const workerResult = await createWorkerAndWait(createSchedulingDto);

    this.logger.log(
      `Worker result: ${JSON.stringify(workerResult)}`,
      `ATTEMPT_ID: ${attempt.id}`,
    );

    const score = this.calculateScore(workerResult);
    const isAcceptable = this.checkIfResultIsAcceptable(score);

    this.logger.log(
      `Score: ${score}, Is Acceptable: ${isAcceptable}`,
      `ATTEMPT_ID: ${attempt.id}`,
    );

    this.attemptService.update({
      id: attempt.id,
      isAcceptable,
      score,
      report: workerResult.completeTrace,
      fails: workerResult.failures,
      passes: workerResult.passes,
      status: AttemptStatus.COMPLETED,
    });

    this.logger.log(
      `Attempt updated successfully with status: ${AttemptStatus.COMPLETED}`,
      `ATTEMPT_ID: ${attempt.id}`,
    );
  }
}
