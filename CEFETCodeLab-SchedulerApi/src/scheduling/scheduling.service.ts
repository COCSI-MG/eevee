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
    (createWorkerData: CreateWorkerDto, dependencies: string[]) => Promise<WorkerResponse>
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
      result.passes /
      (result.passes + result.failures || 1)
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

    const dependencies: string[] = []

    const filledTemplates = await Promise.all(
      assignment.assignmentTemplates.map(async (templateRelation) => {
        const templateDependencies = templateRelation.template.dependencies ?? [];
        if (templateDependencies.length > 0) dependencies.push(...templateDependencies);

        let content = await readFileAsString(templateRelation.template.filePath);
        
        for (const param of templateRelation.template.templateParams) {
          const paramValue = assignment.assignmentParams.find(
            (p) => p.templateParamsId === param.id
          )?.value ?? '';
          content = content.replace(new RegExp(`\\$${param.name}\\$`, 'g'), paramValue);
        }
        return content;
      })
    );
    createSchedulingDto.testFilesContent = filledTemplates;

    const workerResult = await createWorkerAndWait(createSchedulingDto, dependencies);

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
    });

    return result;
  }
}
