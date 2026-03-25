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
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFFIX } from '../worker.constants';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';

export class NodeNestJsStrategy implements WorkerExecutionStrategy {
  readonly workerType = WorkerType.NODE_NESTJS;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFFIX[WorkerType.NODE_NESTJS],
    imageName: WORKER_IMAGE_NAMES[WorkerType.NODE_NESTJS],
    srcPath: '/app/workspace/src',
    testPath: '/app/workspace/test',
  };

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.applicationFileContent ?? '',
        '/app/src/app.module.ts',
      ),
    );

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        '/app/test/template-variables.ts',
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
          `/app/test/validation${index}.e2e-spec.ts`,
        ),
      );
    });

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm run start:worker');

    return asShellCommand(commands);
  }

  processLogResult = parseJestLogResult;

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        '/app/test/template-variables.ts',
      ),
    );

    const install = buildNpmInstallCommand(createWorkerData.dependencies ?? []);
    if (install) commands.push(install);

    commands.push('npm run start:worker');

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
      testFileSuffix: 'e2e-spec.ts',
    });
  }
}
