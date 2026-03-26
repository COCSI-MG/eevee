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

/**
 * Strategy for NODE_DEFAULT_POSTGRESQL workers.
 *
 * Extends the base bootstrap strategy by adding:
 * 1. A Postgres sidecar init container (`restartPolicy: Always`, K8s 1.28+)
 * 2. A seed-database init container that waits for Postgres and runs the
 *    professor's `initSqlScript`.
 */
export class NodeDefaultPostgresqlJestStrategy extends BootstrapInitContainerStrategy {
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

    const install = buildNpmInstallCommand(dependencies);
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  buildJobOptions(
    encodedDefinition: string,
    initSqlScript?: string,
  ): KubernetesJobOptions {
    const baseOptions = super.buildJobOptions(encodedDefinition, initSqlScript);

    baseOptions.initContainers!.push(
      {
        name: 'postgres-db',
        image: 'postgres:16-alpine',
        imagePullPolicy: 'IfNotPresent',
        restartPolicy: 'Always',
        env: [{ name: 'POSTGRES_PASSWORD', value: 'root' }],
      },
      {
        name: 'seed-database',
        image: 'postgres:16-alpine',
        imagePullPolicy: 'IfNotPresent',
        command: [
          'sh',
          '-c',
          `until pg_isready -h localhost -U postgres; do sleep 1; done && psql -h localhost -U postgres -c "${initSqlScript ?? ''}"`,
        ],
      },
    );

    return baseOptions;
  }
}
