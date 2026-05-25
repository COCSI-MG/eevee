import { Injectable } from '@nestjs/common';
import { normalizeTemplateImportPaths } from 'src/utils/template-import-path.utils';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { WorkerService } from 'src/worker/worker.service';
import { WorkerTestFile } from 'src/worker/worker.interfaces';

@Injectable()
export class WorkerPayloadBuilderService {
  constructor(private readonly workerService: WorkerService) {}

  async build(
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
