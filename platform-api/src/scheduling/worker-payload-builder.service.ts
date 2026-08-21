import { Injectable } from '@nestjs/common';
import { normalizeTemplateImportPaths } from 'src/utils/template-import-path.utils';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { WorkerTestFile } from 'src/worker/worker.interfaces';

const WORKER_PATHS: Partial<Record<WorkerType, { srcPath: string; testPath: string }>> = {
  [WorkerType.NODE_DEFAULT]: { srcPath: '/app/src', testPath: '/app/test' },
  [WorkerType.NODE_GRPCJS]: { srcPath: '/app/src', testPath: '/app/test' },
  [WorkerType.NODE_NESTJS]: { srcPath: '/app/src', testPath: '/app/test' },
  [WorkerType.NODE_NEXTJS_CYPRESS]: { srcPath: '/app/src', testPath: '/app/cypress/e2e' },
  [WorkerType.NODE_REACTJS_CYPRESS]: { srcPath: '/app/src', testPath: '/app/cypress/e2e' },
  [WorkerType.NODE_DEFAULT_POSTGRESQL]: { srcPath: '/app/src', testPath: '/app/test' },
  [WorkerType.NODE_NESTJS_POSTGRESQL]: { srcPath: '/app/src', testPath: '/app/test' },
  [WorkerType.NODE_TERAORM]: { srcPath: '/app/src', testPath: '/app/test' },
  [WorkerType.PYTHON_DEFAULT]: { srcPath: '/app/src', testPath: '/app/test' },
};

@Injectable()
export class WorkerPayloadBuilderService {
  async build(
    workerType: WorkerType,
    assignmentTemplates: any[],
    baseWorkerData: CreateWorkerDto,
    templateVariablesModuleContent?: string,
  ): Promise<CreateWorkerDto> {
    const paths = WORKER_PATHS[workerType];
    if (!paths) throw new Error(`Unsupported workerType: ${workerType}`);
    const { srcPath, testPath } = paths;

    const dependencies = [...(baseWorkerData.dependencies ?? [])];
    const testFiles: WorkerTestFile[] = [];

    const testFilesContent = await Promise.all(
      assignmentTemplates.map(async (templateRelation) => {
        const templateDependencies =
          templateRelation.template.dependencies ?? [];
        if (templateDependencies.length > 0)
          dependencies.push(...templateDependencies);

        const content = templateRelation.template.content ?? '';

        const normalizedContent = normalizeTemplateImportPaths({
          content,
          srcPath,
          testPath,
        });

        if (!normalizedContent.trim()) {
          return '';
        }

        testFiles.push({
          templateId: templateRelation.template.id,
          type: workerType,
          content: normalizedContent,
        });

        return normalizedContent;
      }),
    );

    const nonEmptyTestFilesContent = testFilesContent.filter((content) =>
      content.trim(),
    );

    return {
      ...baseWorkerData,
      testFilesContent: nonEmptyTestFilesContent,
      testFiles,
      dependencies,
      templateVariablesModuleContent:
        templateVariablesModuleContent ??
        baseWorkerData.templateVariablesModuleContent,
    };
  }
}
