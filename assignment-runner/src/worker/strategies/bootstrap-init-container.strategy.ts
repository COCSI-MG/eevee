import { KubernetesJobOptions } from 'src/kubernetes/kubernetes.interfaces';
import {
  WorkerExecutionStrategy,
  WorkerConfig,
} from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { WorkerResponse } from '../worker.interfaces';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import {
  WORKER_BOOTSTRAP_IMAGE_NAME,
  WORKER_DEFINITION_B64_ENV_NAME,
} from '../worker.constants';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';
import { buildSharedEmptyDirMounts } from 'src/worker/utils/shared-empty-dir.utils';

/**
 * Abstract base strategy for workers that use the bootstrap init container
 * pattern (i.e. the `createWorkerFromDefinition` flow).
 *
 * Centralizes the common K8s job options: shared emptyDir volume and the
 * `eevee-worker-bootstrap` init container. Subclasses can override
 * `buildJobOptions` to append additional init containers (e.g. Postgres).
 */
export abstract class BootstrapInitContainerStrategy
  implements WorkerExecutionStrategy
{
  abstract readonly workerType: WorkerType;
  abstract readonly workerConfig: WorkerConfig;
  abstract processLogResult(log: string): WorkerResponse;

  abstract buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[];
  abstract buildExecutionJobCommand(
    createWorkerData: CreateWorkerDto,
  ): string[];
  abstract buildWorkerPayload(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): WorkerJobPayload;

  buildJobOptions(
    encodedDefinition: string,
    _initSqlScript?: string,
  ): KubernetesJobOptions {
    const sharedMounts = buildSharedEmptyDirMounts(
      this.workerConfig.srcPath,
      this.workerConfig.testPath,
    );

    return {
      sharedEmptyDir: {
        volumeName: 'worker-app-volume',
        mounts: sharedMounts,
      },
      initContainers: [
        {
          name: 'eevee-worker-bootstrap',
          image: WORKER_BOOTSTRAP_IMAGE_NAME,
          env: [
            {
              name: WORKER_DEFINITION_B64_ENV_NAME,
              value: encodedDefinition,
            },
          ],
        },
      ],
    };
  }
}
