import { KubernetesJobOptions } from 'src/kubernetes/kubernetes.interfaces';
import { BootstrapInitContainerStrategy } from './bootstrap-init-container.strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { parseJestLogResult } from './worker-log-parsers';
import { WorkerConfig } from './worker-execution-strategy';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFFIX } from '../worker.constants';
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

/**
 * Strategy for NODE_DEFAULT_POSTGRESQL workers.
 *
 * Extends the base bootstrap strategy by adding:
 * 1. A Postgres sidecar init container (`restartPolicy: Always`, K8s 1.28+)
 * 2. A seed-database init container that waits for Postgres and runs the
 *    professor's `initSqlScript`.
 */
export class NodeDefaultPostgresqlJestStrategy extends BootstrapInitContainerStrategy {
  private logger = new Logger(NodeDefaultPostgresqlJestStrategy.name);

  readonly workerType = WorkerType.NODE_DEFAULT_POSTGRESQL;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFFIX[WorkerType.NODE_DEFAULT_POSTGRESQL],
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

  buildJobOptions(
    encodedDefinition: string,
    initSqlScript?: string,
  ): KubernetesJobOptions {
    const baseOptions = super.buildJobOptions(encodedDefinition, initSqlScript);

    this.logger.debug(
      `Building job options for NODE_DEFAULT_POSTGRESQL with initSqlScript: ${initSqlScript}`,
    );

    baseOptions.initContainers!.push(
      {
        name: 'postgres-db',
        image: 'postgres:16',
        imagePullPolicy: 'IfNotPresent',
        restartPolicy: 'Always',
        env: [
          { name: 'POSTGRES_USER', value: 'postgres' },
          { name: 'POSTGRES_PASSWORD', value: 'postgres' },
          { name: 'POSTGRES_DB', value: 'eevee' },
        ],
      },
      {
        name: 'seed-database',
        image: 'postgres:16',
        imagePullPolicy: 'IfNotPresent',
        env: [
          { name: 'PGPASSWORD', value: 'postgres' },
          { name: 'POSTGRES_DB', value: 'eevee' },
        ],
        command: [
          'sh',
          '-c',
          `until pg_isready -h localhost -U postgres -d "$POSTGRES_DB"; do sleep 1; done && psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d "$POSTGRES_DB" -c "${initSqlScript ?? ''}"`,
        ],
      },
    );

    return baseOptions;
  }
}
