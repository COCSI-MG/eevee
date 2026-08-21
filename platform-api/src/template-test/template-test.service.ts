import { Injectable, Logger } from '@nestjs/common';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { ExecutionRequestService } from 'src/execution/execution-request.service';
import {
  buildTemplateVariablesModuleFromParams,
  templateVariablesLanguageForWorker,
} from 'src/utils/template-variables.utils';
import { TestTemplateDto } from './dto/test-template.dto';

const APP_FILE_EXTENSION_BY_WORKER_TYPE: Partial<Record<WorkerType, string>> = {
  [WorkerType.JAVASCRIPT_DEFAULT]: '.js',
  [WorkerType.PYTHON_DEFAULT]: '.py',
};

const APP_FILE_EXTENSION_DEFAULT = '.ts';

@Injectable()
export class TemplateTestService {
  private readonly logger = new Logger(TemplateTestService.name);

  constructor(private readonly executionRequestService: ExecutionRequestService) {}

  async run(body: TestTemplateDto): Promise<WorkerResponse> {
    const paramSpecs = (body.paramDefs ?? []).map((d) => ({
      name: d.name,
      type: d.type,
    }));

    // The init-container bootstrap writes `files` to the worker srcPath
    // (e.g. /app/src) and `testFiles` to the testPath (e.g. /app/test).
    // Test file names are assigned by the selected strategy, so we cannot put
    // the application under a custom name in `testFiles`.
    //
    // The bootstrap normalizes relative paths with `..` via `path.join`, so
    // we mirror the app under srcPath/../test/app.<ext>.
    // Tests can then import from `../src/app` (canonical) or `./app`
    // (legacy, same dir as the test).
    const extension =
      APP_FILE_EXTENSION_BY_WORKER_TYPE[body.workerType] ??
      APP_FILE_EXTENSION_DEFAULT;
    const appFileName = `app${extension}`;
    const appFileInTestDir = `../test/${appFileName}`;
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
      files[`../test/template-variables${templateVariablesExtension}`] =
        templateVariablesModuleContent;
    }

    if (body.applicationFileContent) {
      files[appFileName] = body.applicationFileContent;
      files[appFileInTestDir] = body.applicationFileContent;
    }

    const workerData: CreateWorkerDto = {
      files: Object.keys(files).length ? files : null,
      testFilesContent: [body.templateContent],
      dependencies: body.dependencies ?? [],
      templateVariablesModuleContent,
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
