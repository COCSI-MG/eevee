import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { ExecutionRequestService } from 'src/execution/execution-request.service';
import {
  buildTemplateVariablesModuleFromParams,
  templateVariablesLanguageForWorker,
} from 'src/utils/template-variables.utils';
import { TestTemplateDto } from './dto/test-template.dto';
import { ClassAccessService } from 'src/auth/class-access.service';
import { TemplateResourceService } from 'src/template/template-resource.service';
import { WORKER_PATHS } from 'src/scheduling/worker-payload-builder.service';
import { normalizeTemplateImportPaths } from 'src/utils/template-import-path.utils';

const APP_FILE_EXTENSION_BY_WORKER_TYPE: Partial<Record<WorkerType, string>> = {
  [WorkerType.JAVASCRIPT_DEFAULT]: '.js',
  [WorkerType.PYTHON_DEFAULT]: '.py',
};

const APP_FILE_EXTENSION_DEFAULT = '.ts';

@Injectable()
export class TemplateTestService {
  private readonly logger = new Logger(TemplateTestService.name);

  constructor(
    private readonly executionRequestService: ExecutionRequestService,
    private readonly classAccess: ClassAccessService,
    private readonly templateResources: TemplateResourceService,
  ) {}

  async run(body: TestTemplateDto): Promise<WorkerResponse> {
    await this.classAccess.assertTeacherAssignment(body.classId);
    let templateSnapshots: CreateWorkerDto['templateSnapshots'];
    if (body.templateId != null) {
      const template = await this.classAccess.assertTemplateAccess(body.templateId, true);
      if (template.classId !== body.classId) {
        throw new BadRequestException('Template does not belong to the selected class');
      }
      templateSnapshots = await this.templateResources.workerSnapshots(body.templateId);
    }

    const paramSpecs = (body.paramDefs ?? []).map((d) => ({
      name: d.name,
      type: d.type,
    }));

    const extension =
      APP_FILE_EXTENSION_BY_WORKER_TYPE[body.workerType] ??
      APP_FILE_EXTENSION_DEFAULT;
    const appFileName = `app${extension}`;
    const templateVariablesLanguage = templateVariablesLanguageForWorker(
      body.workerType,
    );
    const templateVariablesExtension =
      templateVariablesLanguage === 'javascript' ? '.js' : '.ts';

    const userFiles = body.files ?? {};
    const files: Record<string, string> = { ...userFiles };
    const templateVariablesModuleContent =
      buildTemplateVariablesModuleFromParams(
        body.params ?? {},
        paramSpecs,
        templateVariablesLanguage,
      );

    if (body.workerType !== WorkerType.PYTHON_DEFAULT) {
      files[`template-variables${templateVariablesExtension}`] =
        templateVariablesModuleContent;
    }

    if (body.applicationFileContent) {
      files[appFileName] = body.applicationFileContent;
    }

    const workerData: CreateWorkerDto = {
      files: Object.keys(files).length ? files : null,
      testFilesContent: [normalizeTemplateImportPaths({
        content: body.templateContent,
        ...WORKER_PATHS[body.workerType],
      })],
      dependencies: body.dependencies ?? [],
      templateVariablesModuleContent,
      templateSnapshots,
    };

    const jobName = `template-test-preview-${Date.now()}`;

    this.logger.debug({
      message: 'Running template-test preview',
      workerType: body.workerType,
      jobName,
    });

    return this.executionRequestService.execute({
      jobName,
      workerType: body.workerType,
      workerData,
    });
  }
}
