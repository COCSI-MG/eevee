import { KubernetesJobOptions } from 'src/kubernetes/kubernetes.interfaces';
import { WorkerExecutionStrategy, WorkerConfig } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { WorkerResponse } from '../worker.interfaces';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WORKER_DEFINITION_B64_ENV_NAME } from '../worker.constants';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';

/**
 * Abstract base strategy for workers that use the bootstrap init container
 * pattern (i.e. the `createWorkerFromDefinition` flow).
 *
 * Centralizes the common K8s job options: shared emptyDir volume and the
 * `eevee-worker-bootstrap` init container. Subclasses can override
 * `buildJobOptions` to append additional init containers (e.g. Postgres).
 */
export abstract class BootstrapInitContainerStrategy
  implements WorkerExecutionStrategy {
  abstract readonly workerType: WorkerType;
  abstract readonly workerConfig: WorkerConfig;
  abstract processLogResult(log: string): WorkerResponse;

  abstract buildJobCommand(createWorkerData: CreateWorkerDto, dependencies: string[]): string[];
  abstract buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[];
  abstract buildWorkerPayload(createWorkerData: CreateWorkerDto, dependencies: string[]): WorkerJobPayload;

  buildJobOptions(
    encodedDefinition: string,
    _initSqlScript?: string,
  ): KubernetesJobOptions {
    return {
      sharedEmptyDir: {
        volumeName: 'worker-app-volume',
        mountPath: '/app/workspace',
      },
      initContainers: [
        {
          name: 'eevee-worker-bootstrap',
          image: 'eevee-worker-bootstrap',
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
