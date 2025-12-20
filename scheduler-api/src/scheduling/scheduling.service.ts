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
import { readFileAsString } from 'src/utils/template.utils';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';
import { CreateWorkerFromDefinitionDto } from 'src/worker/dto/create-worker-from-definition.dto';
import { WorkerDefinitionDto } from 'src/worker/dto/worker-definition.dto';
import { plainToClass } from 'class-transformer';
import { WorkerTestFile } from 'src/worker/worker.interfaces';
import { buildTemplateVariablesModule } from 'src/utils/template-variables.utils';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  /**
   * Map of worker types to their corresponding worker creation functions.
   * This allows for dynamic worker creation based on the worker type specified in the assignment.
   */
  readonly workerMap = new Map<
    WorkerType,
    (
      createWorkerData: CreateWorkerDto,
      dependencies: string[],
    ) => Promise<WorkerResponse>
  >();

  constructor(
    private readonly workerService: WorkerService,
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
    this.workerMap.set(
      WorkerType.NODE_GRPCJS,
      workerService.createGrpcJsWorkerAndWait.bind(workerService),
    );

    this.workerMap.set(
      WorkerType.NODE_NEXTJS_CYPRESS,
      workerService.createNextJsCypressWorkerAndWait.bind(workerService),
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

    const dependencies: string[] = [];

    const testFiles: WorkerTestFile[] = [];

    const filledTemplates = await Promise.all(
      assignment.assignmentTemplates.map(async (templateRelation) => {
        const templateDependencies =
          templateRelation.template.dependencies ?? [];
        if (templateDependencies.length > 0)
          dependencies.push(...templateDependencies);

        const content = await readFileAsString(
          templateRelation.template.filePath,
        );

        testFiles.push({
          templateId: templateRelation.template.id,
          type: assignment.workerType,
          content,
        });
        return content;
      }),
    );

    createSchedulingDto.testFilesContent = filledTemplates;
    createSchedulingDto.testFiles = testFiles;
    createSchedulingDto.templateVariablesModuleContent =
      buildTemplateVariablesModule(assignment);

    const workerResult = await createWorkerAndWait(
      createSchedulingDto,
      dependencies,
    );

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

    this.logger.log('Sending scheduling job to Kafka');

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

    const workerDefinitionDto = plainToClass(WorkerDefinitionDto, {
      files: createSchedulingDto.files,
      startCommands: assignment.workerDefinition.startCommands,
      testCommands: assignment.workerDefinition.testCommands,
      dependencies: assignment.workerDefinition.dependencies,
    });

    const message = plainToClass(CreateSchedulingJobMessageDto, {
      attemptId: newAttempt.id,
      definition: workerDefinitionDto,
    });

    await this.producerService.produce(SCHEDULING_CREATE_JOB_TOPIC, {
      key: newAttempt.id.toString(),
      value: JSON.stringify(message),
    });

    this.logger.log(`Scheduling job created with attempt ID: ${newAttempt.id}`);
  }

  /**
   * Processes a scheduling job message.
   *
   * @param payload - The message containing the scheduling job details.
   */
  async ProcessJobAndWait(
    attemptId: number,
    payload: CreateSchedulingJobMessageDto,
  ) {
    this.logger.log(`Processing scheduling job for attempt ID: ${attemptId}`);

    const attempt = await this.attemptService.findOne(attemptId);
    if (!attempt) {
      this.logger.fatal(
        `Attempt with ID ${attemptId} not found in job processing`,
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

    let testFilesContent: string[] = [];
    if (
      attempt.assignment.assignmentTemplates !== undefined &&
      attempt.assignment.assignmentTemplates.length === 0
    ) {
      this.logger.warn(
        `No templates found for assignment ID ${attempt.assignmentId}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );
    } else {
      testFilesContent = await this.assignmentService.getAssignmentTemplates(
        attempt.assignment,
      );
    }

    if (attempt.assignment.validationScript) {
      testFilesContent.push(attempt.assignment.validationScript);
    }

    if (testFilesContent.length === 0) {
      this.logger.fatal(
        `No test files content generated for attempt ID ${attempt.id}`,
      );
    }

    const createWorkerFromDefinitionDto = plainToClass(
      CreateWorkerFromDefinitionDto,
      {
        type: attempt.assignment.workerType,
        definition: payload.definition,
        testFilesContent,
      },
    );

    try {
      const workerResult = await this.workerService.createWorkerFromDefinition(
        attempt.id.toString(),
        createWorkerFromDefinitionDto,
      );

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

      await this.attemptService.update({
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
    } catch (err) {
      this.logger.fatal(
        `Worker creation failed for attempt ID ${attempt.id}: ${err.message}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );

      await this.attemptService.update({
        id: attempt.id,
        isAcceptable: false,
        score: 0,
        report: `Worker creation failed: ${err.message}`,
        fails: 0,
        passes: 0,
        status: AttemptStatus.FAILED,
      });
    }
  }

  private isUserReachedMaxAttempt(maxAttempts: number, currentAttemps: number) {
    return maxAttempts <= currentAttemps;
  }
}
