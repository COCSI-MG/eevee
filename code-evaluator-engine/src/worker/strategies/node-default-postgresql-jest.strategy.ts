import { WorkerType } from '../enum/worker-type.enum';
import { parseJestLogResult } from './worker-log-parsers';
import { WorkerConfig } from './worker-execution-strategy';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFIX } from '../worker.constants';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  asShellCommand,
  buildWorkerPayload,
  buildNpmInstallCommand,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';
import { Logger } from '@nestjs/common/services/logger.service';
import { PostgresqlContainerStrategy } from './postgresql-container.strategy';

/**
 * Strategy for NODE_DEFAULT_POSTGRESQL workers.
 *
 * Extends the base bootstrap strategy by adding:
 * 1. A Postgres sidecar init container (`restartPolicy: Always`, K8s 1.28+)
 * 2. A seed-database init container that waits for Postgres and runs the
 *    professor's `initSqlScript`.
 */
export class NodeDefaultPostgresqlJestStrategy extends PostgresqlContainerStrategy {
  private logger = new Logger(NodeDefaultPostgresqlJestStrategy.name);

  readonly workerType = WorkerType.NODE_DEFAULT_POSTGRESQL;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFIX[WorkerType.NODE_DEFAULT_POSTGRESQL],
    imageName: WORKER_IMAGE_NAMES[WorkerType.NODE_DEFAULT_POSTGRESQL],
    srcPath: '/app/src',
    testPath: '/app/test',
  };

  processLogResult = parseJestLogResult;

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        this.workerConfig.srcPath + '/template-variables.ts',
      ),
    );

    const dependencies = [
      ...(createWorkerData.dependencies ?? []),
      'pg', // Ensure 'pg' is included for Postgres connectivity in tests
    ];
    const install = buildNpmInstallCommand(dependencies);
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

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        this.workerConfig.srcPath + '/template-variables.ts',
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
          this.workerConfig.testPath + `/validation${index}.test.ts`,
        ),
      );
    });

    // Install dependencies including 'pg' for Postgres connectivity in tests
    const install = buildNpmInstallCommand([...dependencies, 'pg', '--save']);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }
}
