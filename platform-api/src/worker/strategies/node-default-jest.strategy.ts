import { WorkerExecutionStrategy, WorkerConfig } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildWorkerPayload,
  buildNpmInstallCommand,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';
import { parseJestLogResult } from './worker-log-parsers';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFIX } from '../worker.constants';
import { WorkerJobPayload } from '../worker-job-payload.type';

export class NodeDefaultJestStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_DEFAULT;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFIX[WorkerType.NODE_DEFAULT],
    imageName: WORKER_IMAGE_NAMES[WorkerType.NODE_DEFAULT],
    srcPath: '/app/src',
    testPath: '/app/test',
  };

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.applicationFileContent ?? '',
        '/app/app.ts',
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
          `/app/validation${index}.test.ts`,
        ),
      );
    });

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  processLogResult = parseJestLogResult;

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        this.workerConfig.srcPath + '/template-variables.ts',
      )
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
      testFileSuffix: 'spec.ts',
    });
  }
}
