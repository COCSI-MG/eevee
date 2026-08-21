import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerType } from '../enum/worker-type.enum';
import { WorkerJobPayload } from '../worker-job-payload.type';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFIX } from '../worker.constants';
import {
  asShellCommand,
  buildNpmInstallCommand,
  buildWorkerPayload,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';
import { parseJestLogResult } from './worker-log-parsers';
import {
  WorkerConfig,
  WorkerExecutionStrategy,
} from './worker-execution-strategy';

export class JavascriptDefaultJestStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.JAVASCRIPT_DEFAULT;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFIX[WorkerType.JAVASCRIPT_DEFAULT],
    imageName: WORKER_IMAGE_NAMES[WorkerType.JAVASCRIPT_DEFAULT],
    srcPath: '/app/src',
    testPath: '/app/test',
  };

  processLogResult = parseJestLogResult;

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [
      buildWriteFileCommand(
        createWorkerData.applicationFileContent ?? '',
        '/app/app.js',
      ),
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        '/app/template-variables.js',
      ),
    ];

    const normalizedTestFiles = normalizeTestFiles(
      createWorkerData.testFilesContent ?? [],
      createWorkerData.testFiles,
    );

    normalizedTestFiles.forEach((testFile, index) => {
      commands.push(
        buildWriteFileCommand(
          testFile.content,
          `/app/validation${index}.test.js`,
        ),
      );
    });

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');
    return asShellCommand(commands);
  }

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    const commands: string[] = [
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        `${this.workerConfig.srcPath}/template-variables.js`,
      ),
    ];

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
      testFileSuffix: 'spec.js',
    });
  }
}
