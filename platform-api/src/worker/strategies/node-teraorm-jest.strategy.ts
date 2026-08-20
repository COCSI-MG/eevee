import { KubernetesJobOptions } from 'src/kubernetes/kubernetes.interfaces';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerType } from '../enum/worker-type.enum';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFIX } from '../worker.constants';
import { BootstrapInitContainerStrategy } from './bootstrap-init-container.strategy';
import { WorkerConfig } from './worker-execution-strategy';
import { parseJestLogResult } from './worker-log-parsers';
import {
  asShellCommand,
  buildNpmInstallCommand,
  buildWorkerPayload,
  buildWriteFileCommand,
  normalizeTestFiles,
} from './worker-strategy-helpers';

const PRELOADED_PACKAGES = new Set([
  'teraorm',
  '@teraorm/bigquery',
  '@teraorm/nestjs',
]);

const BQ_SECRET_NAME = 'eevee-bq-credentials';
const BQ_SECRET_VOLUME = 'bq-credentials';
const BQ_SECRET_MOUNT_PATH = '/var/run/gcp';
const BQ_CREDENTIALS_FILE = 'sa.json';
const BQ_PROJECT_ID =
  process.env.WORKER_GOOGLE_CLOUD_PROJECT || 'teraorm-survey';
const TERAORM_PROXY_URL =
  process.env.WORKER_TERAORM_PROXY_URL ||
  'http://eevee-egress-proxy-service:3128';
const TERAORM_NO_PROXY =
  process.env.WORKER_TERAORM_NO_PROXY ||
  '127.0.0.1,localhost,.svc,.cluster.local,kubernetes.default.svc';

function stripPreloaded(dependencies: string[]): string[] {
  return dependencies.filter((dep) => !PRELOADED_PACKAGES.has(dep));
}

export class NodeTeraormJestStrategy extends BootstrapInitContainerStrategy {
  readonly workerType = WorkerType.NODE_TERAORM;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFIX[WorkerType.NODE_TERAORM],
    imageName: WORKER_IMAGE_NAMES[WorkerType.NODE_TERAORM],
    srcPath: '/app/src',
    testPath: '/app/test',
  };

  processLogResult = parseJestLogResult;

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

    const install = buildNpmInstallCommand(stripPreloaded(dependencies));
    if (install) commands.push(install);

    commands.push('npm start');

    return asShellCommand(commands);
  }

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    const commands: string[] = [];

    commands.push(
      buildWriteFileCommand(
        createWorkerData.templateVariablesModuleContent ?? '',
        this.workerConfig.srcPath + '/template-variables.ts',
      ),
    );

    const install = buildNpmInstallCommand(
      stripPreloaded(createWorkerData.dependencies ?? []),
    );
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
      dependencies: stripPreloaded(dependencies),
      srcPath: this.workerConfig.srcPath,
      testPath: this.workerConfig.testPath,
      testFileSuffix: 'spec.ts',
    });
  }

  buildJobOptions(
    encodedDefinition: string,
    initSqlScript?: string,
  ): KubernetesJobOptions {
    const base = super.buildJobOptions(encodedDefinition, initSqlScript);

    console.log('Project id for BigQuery integration:', BQ_PROJECT_ID);

    return {
      ...base,
      podLabels: {
        'eevee/worker-type': 'node-teraorm',
        'eevee/network-profile': 'google-egress',
      },
      secretVolumes: [
        {
          secretName: BQ_SECRET_NAME,
          volumeName: BQ_SECRET_VOLUME,
          mountPath: BQ_SECRET_MOUNT_PATH,
        },
      ],
      mainContainerEnv: [
        {
          name: 'GOOGLE_APPLICATION_CREDENTIALS',
          value: `${BQ_SECRET_MOUNT_PATH}/${BQ_CREDENTIALS_FILE}`,
        },
        {
          name: 'GOOGLE_CLOUD_PROJECT',
          value: BQ_PROJECT_ID,
        },
        {
          name: 'HTTPS_PROXY',
          value: TERAORM_PROXY_URL,
        },
        {
          name: 'HTTP_PROXY',
          value: TERAORM_PROXY_URL,
        },
        {
          name: 'NO_PROXY',
          value: TERAORM_NO_PROXY,
        },
        {
          name: 'https_proxy',
          value: TERAORM_PROXY_URL,
        },
        {
          name: 'http_proxy',
          value: TERAORM_PROXY_URL,
        },
        {
          name: 'no_proxy',
          value: TERAORM_NO_PROXY,
        },
      ],
    };
  }
}
