import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { WorkerService } from 'src/worker/worker.service';
import { AttemptService } from 'src/attempt/attempt.service';
import { AssignmentService } from 'src/assignment/assignment.service';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { readFileAsString } from 'src/utils/template.utils';

@Injectable()
export class SchedulingService {
  readonly workerMap = new Map<
    WorkerType,
    (createWorkerData: CreateWorkerDto) => Promise<WorkerResponse>
  >();
  constructor(
    workerService: WorkerService,
    private readonly attemptService: AttemptService,
    private readonly assignmentService: AssignmentService,
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
    return (
      result.passes.length /
      (result.passes.length + result.failures.length || 1)
    );
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

    createSchedulingDto.testFileContent = await readFileAsString(assignment.assignmentTemplates[0].template.filePath);

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
      fails: workerResult.failures?.length,
      passes: workerResult.passes?.length,
    });

    return result;
  }
}
