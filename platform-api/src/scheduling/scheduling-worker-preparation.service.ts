import { Injectable } from '@nestjs/common';
import {
  buildTemplateVariablesModule,
  templateVariablesLanguageForWorker,
} from 'src/utils/template-variables.utils';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerPayloadBuilderService } from './worker-payload-builder.service';
import { Assignment } from 'src/assignment/entities/assignment.entity';

export class NoTemplatesForAssignmentError extends Error {
  constructor(assignmentId: number) {
    super(`No templates found for assignment ID ${assignmentId}`);
    this.name = 'NoTemplatesForAssignmentError';
  }
}

export class NoTestFilesGeneratedError extends Error {
  constructor(attemptId?: number) {
    super(
      attemptId
        ? `No test files content generated for attempt ID ${attemptId}`
        : 'No test files content generated for execution payload',
    );
    this.name = 'NoTestFilesGeneratedError';
  }
}

@Injectable()
export class SchedulingWorkerPreparationService {
  constructor(
    private readonly workerPayloadBuilderService: WorkerPayloadBuilderService,
  ) {}

  async prepare(params: {
    assignment: Assignment;
    baseWorkerData: CreateWorkerDto;
    attemptId?: number;
  }): Promise<CreateWorkerDto> {
    const { assignment, baseWorkerData, attemptId } = params;

    if ((assignment.assignmentTemplates?.length ?? 0) === 0) {
      throw new NoTemplatesForAssignmentError(assignment.id);
    }

    const workerData = await this.workerPayloadBuilderService.build(
      assignment.workerType,
      assignment.assignmentTemplates,
      {
        ...baseWorkerData,
        initSqlScript: assignment.initSqlScript ?? baseWorkerData.initSqlScript,
      },
      buildTemplateVariablesModule(
        assignment,
        templateVariablesLanguageForWorker(assignment.workerType),
      ),
    );

    if ((workerData.testFilesContent?.length ?? 0) === 0) {
      throw new NoTestFilesGeneratedError(attemptId);
    }

    return workerData;
  }
}
