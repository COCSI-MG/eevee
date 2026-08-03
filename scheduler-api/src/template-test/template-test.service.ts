import { Injectable, Logger } from '@nestjs/common';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerResponse } from 'src/worker/worker.interfaces';
import { WorkerService } from 'src/worker/worker.service';
import { buildTemplateVariablesModuleFromParams } from 'src/utils/template-variables.utils';
import { TestTemplateDto } from './dto/test-template.dto';

const APP_FILE_NAME = 'app.ts';
const APP_FILE_IN_TEST_DIR = '../test/app.ts';

@Injectable()
export class TemplateTestService {
  private readonly logger = new Logger(TemplateTestService.name);

  constructor(private readonly workerService: WorkerService) {}

  async run(body: TestTemplateDto): Promise<WorkerResponse> {
    const paramSpecs = (body.paramDefs ?? []).map((d) => ({
      name: d.name,
      type: d.type,
    }));

    // The init-container bootstrap writes `files` to the worker srcPath
    // (e.g. /app/src) and `testFiles` to the testPath (e.g. /app/test).
    // Test file names are forced to `<index>-template.spec.ts` by the
    // strategy, so we cannot put the app under a custom name in `testFiles`.
    //
    // The bootstrap normalizes relative paths with `..` via `path.join`, so
    // we mirror the app under srcPath/../test/app.ts → /app/test/app.ts.
    // Tests can then import from `../src/app` (canonical) or `./app`
    // (legacy, same dir as the test).
    const userFiles = body.files ?? {};
    const files: Record<string, string> = { ...userFiles };

    if (body.applicationFileContent) {
      files[APP_FILE_NAME] = body.applicationFileContent;
      files[APP_FILE_IN_TEST_DIR] = body.applicationFileContent;
    }

    const workerData: CreateWorkerDto = {
      files: Object.keys(files).length ? files : null,
      testFilesContent: [body.templateContent],
      dependencies: body.dependencies ?? [],
      templateVariablesModuleContent: buildTemplateVariablesModuleFromParams(
        body.params ?? {},
        paramSpecs,
      ),
    };

    const jobName = `template-test-preview-${Date.now()}`;

    this.logger.debug({
      message: 'Running template-test preview',
      workerType: body.workerType,
      jobName,
    });

    return this.workerService.createWorkerWithInitContainer(
      jobName,
      body.workerType,
      workerData,
    );
  }
}
