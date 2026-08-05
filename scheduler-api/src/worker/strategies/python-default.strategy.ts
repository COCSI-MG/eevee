import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerType } from '../enum/worker-type.enum';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFIX } from '../worker.constants';
import { BootstrapInitContainerStrategy } from './bootstrap-init-container.strategy';
import { WorkerConfig } from './worker-execution-strategy';
import { parseJestLogResult } from './worker-log-parsers';
import {
  asShellCommand,
  buildWriteFileCommand,
  buildWorkerPayload,
  normalizeTestFiles,
} from './worker-strategy-helpers';

/**
 * Strategy for PYTHON_DEFAULT workers.
 *
 * Runs Python assignments with pytest. Student source is written by the
 * bootstrap init container under /app/src and validation tests under /app/test;
 * the trigger emits a Jest-compatible summary line so the standard log parser
 * keeps working.
 */
export class PythonDefaultStrategy extends BootstrapInitContainerStrategy {
  readonly workerType = WorkerType.PYTHON_DEFAULT;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFIX[WorkerType.PYTHON_DEFAULT],
    imageName: WORKER_IMAGE_NAMES[WorkerType.PYTHON_DEFAULT],
    srcPath: '/app/src',
    testPath: '/app/test',
  };

  processLogResult = parseJestLogResult;

  buildExecutionJobCommand(_createWorkerData: CreateWorkerDto): string[] {
    return ['python', '-u', '/app/trigger.py'];
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
      testFileSuffix: 'test.py',
    });
  }

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    _dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.applicationFileContent ?? '',
        '/app/src/app.py',
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
          `/app/test/validation${index}.test.py`,
        ),
      );
    });

    commands.push('python -u /app/trigger.py');

    return asShellCommand(commands);
  }
}
