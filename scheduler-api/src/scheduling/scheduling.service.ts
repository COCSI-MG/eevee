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
import { WorkerResponse, WorkerTestFile } from 'src/worker/worker.interfaces';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { readFileAsString } from 'src/utils/template.utils';
import { CreateSchedulingJobMessageDto } from './dto/create-scheduling-job-message.dto';
import { plainToClass } from 'class-transformer';
import { buildTemplateVariablesModule } from 'src/utils/template-variables.utils';
import { SchedulerCreateJobPublisher } from './schuduler-create-job.publisher';
import { normalizeTemplateImportPaths } from 'src/utils/template-import-path.utils';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly workerService: WorkerService,
    private readonly attemptService: AttemptService,
    private readonly assignmentService: AssignmentService,
    private readonly schedulerCreateJobPublisher: SchedulerCreateJobPublisher,
  ) {}

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

    const workerData = await this.prepareWorkerData(
      assignment.workerType,
      assignment.assignmentTemplates,
      {
        ...createSchedulingDto,
      },
      buildTemplateVariablesModule(assignment),
    );

    const workerResult = await this.workerService.createSynchronousWorker(
      assignment.workerType,
      workerData,
      workerData.dependencies ?? [],
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

    this.schedulerCreateJobPublisher.publish(message);

    this.logger.log(`Scheduling job created with attempt ID: ${newAttempt.id}`);
  }

  /**
   * Processes a scheduling job message.
   *
   * @param payload - The message containing the scheduling job details.
   */
  async ProcessJobAndWait(payload: CreateSchedulingJobMessageDto) {
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

    await this.attemptService.update({
      id: attempt.id,
      status: AttemptStatus.RUNNING,
    });

    if (
      attempt.assignment.assignmentTemplates !== undefined &&
      attempt.assignment.assignmentTemplates.length === 0
    ) {
      this.logger.fatal(
        `No templates found for assignment ID ${attempt.assignmentId}`,
        `ATTEMPT_ID: ${attempt.id}`,
      );
      await this.attemptService.update({
        id: attempt.id,
        isAcceptable: false,
        report: 'No test files available for execution.',
        status: AttemptStatus.FAILED,
      });
      return;
    }

    const templateVariablesModuleContent = buildTemplateVariablesModule(
      attempt.assignment,
    );

    const workerData = await this.prepareWorkerData(
      attempt.assignment.workerType,
      attempt.assignment.assignmentTemplates,
      {
        ...payload.workerData,
        initSqlScript: attempt.assignment.initSqlScript,
      },
      templateVariablesModuleContent,
    );

    if ((workerData.testFilesContent?.length ?? 0) === 0) {
      this.logger.fatal(
        `No test files content generated for attempt ID ${attempt.id}`,
      );
      await this.attemptService.update({
        id: attempt.id,
        isAcceptable: false,
        report: 'No test files available for execution.',
        status: AttemptStatus.FAILED,
      });
      return;
    }

    try {
      const workerResult =
        await this.workerService.createWorkerWithInitContainer(
          attempt.assignment.workerType,
          workerData,
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

  private async prepareWorkerData(
    workerType: WorkerType,
    assignmentTemplates: any[],
    baseWorkerData: CreateWorkerDto,
    templateVariablesModuleContent?: string,
  ): Promise<CreateWorkerDto> {
    const strategy = this.workerService.getStrategy(workerType);
    const { srcPath, testPath } = strategy.workerConfig;

    const dependencies = [...(baseWorkerData.dependencies ?? [])];
    const testFiles: WorkerTestFile[] = [];

    const testFilesContent = await Promise.all(
      assignmentTemplates.map(async (templateRelation) => {
        const templateDependencies =
          templateRelation.template.dependencies ?? [];
        if (templateDependencies.length > 0)
          dependencies.push(...templateDependencies);

        const content = await readFileAsString(
          templateRelation.template.filePath,
        );

        const normalizedContent = normalizeTemplateImportPaths({
          content,
          srcPath,
          testPath,
        });

        testFiles.push({
          templateId: templateRelation.template.id,
          type: workerType,
          content: normalizedContent,
        });

        return normalizedContent;
      }),
    );

    return {
      ...baseWorkerData,
      testFilesContent,
      testFiles,
      dependencies,
      templateVariablesModuleContent:
        templateVariablesModuleContent ??
        baseWorkerData.templateVariablesModuleContent,
    };
  }
}
