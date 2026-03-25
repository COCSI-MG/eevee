import { WorkerExecutionStrategy, WorkerConfig } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildWorkerPayload,
  buildMkdirPCommand,
  buildNpmInstallCommand,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';
import { parseCypressLogResult } from './worker-log-parsers';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFFIX } from '../worker.constants';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';

export class NodeNextJsCypressStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_NEXTJS_CYPRESS;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFFIX[WorkerType.NODE_NEXTJS_CYPRESS],
    imageName: WORKER_IMAGE_NAMES[WorkerType.NODE_NEXTJS_CYPRESS],
    srcPath: '/app/workspace/src',
    testPath: '/app/workspace/cypress/e2e',
  };

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(buildMkdirPCommand('/app/cypress/e2e'));

    commands.push(
      buildWriteFileCommand(
        createWorkerData.applicationFileContent ?? '',
        '/app/student.tsx',
      ),
    );

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        '/app/template-variables.ts',
      ),
    );

    const normalizedTestFiles = normalizeTestFiles(
      createWorkerData.testFilesContent ?? [],
      createWorkerData.testFiles,
    );

    normalizedTestFiles.forEach((testFile, index) => {
      commands.push(
        buildWriteFileCommand(
          testFile.content,
          `/app/cypress/e2e/validation${index}.cy.ts`,
        ),
      );
    });

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  processLogResult = parseCypressLogResult;

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        '/app/template-variables.ts',
      ),
    );

    const install = buildNpmInstallCommand(createWorkerData.dependencies ?? []);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  buildWorkerPayload(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): WorkerJobPayload {
    return buildWorkerPayload({
      files: createWorkerData.files,
      testFilesContent: createWorkerData.testFilesContent,
      testFiles: createWorkerData.testFiles,
      dependencies,
      srcPath: this.workerConfig.srcPath,
      testPath: this.workerConfig.testPath,
      testFileSuffix: 'cy.ts',
    });
  }
}
