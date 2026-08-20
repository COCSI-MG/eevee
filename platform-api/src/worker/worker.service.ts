import { Injectable, Logger } from '@nestjs/common';
import {
  KubernetesJobOptions,
  KubernetesJobResult,
} from 'src/kubernetes/kubernetes.interfaces';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerType } from './enum/worker-type.enum';
import {
  WORKER_BOOTSTRAP_IMAGE_NAME,
  WORKER_DEFINITION_B64_ENV_NAME,
} from './worker.constants';
import { WorkerResponse } from './worker.interfaces';

import { NodeDefaultJestStrategy } from './strategies/node-default-jest.strategy';
import { NodeDefaultPostgresqlJestStrategy } from './strategies/node-default-postgresql-jest.strategy';
import { NodeGrpcJsJestStrategy } from './strategies/node-grpcjs-jest.strategy';
import { NodeNestJsPostgresqlJestStrategy } from './strategies/node-nestjs-postgresql-jest.strategy';
import { NodeNestJsStrategy } from './strategies/node-nestjs.strategy';
import { NodeNextJsCypressStrategy } from './strategies/node-nextjs-cypress.strategy';
import { NodeReactJsCypressIsolatedLogStrategy } from './strategies/node-reactjs-cypress-isolated-log.strategy';
import { NodeTeraormJestStrategy } from './strategies/node-teraorm-jest.strategy';
import { PythonDefaultStrategy } from './strategies/python-default.strategy';
import { WorkerExecutionStrategy } from './strategies/worker-execution-strategy';
import { buildSharedEmptyDirMounts } from './utils/shared-empty-dir.utils';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(private readonly kubernetesService: KubernetesService) {}

  private readonly strategyByWorkerType: Record<
    WorkerType,
    WorkerExecutionStrategy
  > = {
    [WorkerType.NODE_DEFAULT]: new NodeDefaultJestStrategy(),
    [WorkerType.NODE_GRPCJS]: new NodeGrpcJsJestStrategy(),
    [WorkerType.NODE_NESTJS]: new NodeNestJsStrategy(),
    [WorkerType.NODE_NEXTJS_CYPRESS]: new NodeNextJsCypressStrategy(),
    [WorkerType.NODE_REACTJS_CYPRESS]:
      new NodeReactJsCypressIsolatedLogStrategy(),
    [WorkerType.NODE_DEFAULT_POSTGRESQL]:
      new NodeDefaultPostgresqlJestStrategy(),
    [WorkerType.NODE_NESTJS_POSTGRESQL]: new NodeNestJsPostgresqlJestStrategy(), // Reuse NodeNestJsStrategy with Postgres support enabled
    [WorkerType.NODE_TERAORM]: new NodeTeraormJestStrategy(),
    [WorkerType.PYTHON_DEFAULT]: new PythonDefaultStrategy(),
  };

  getStrategy(workerType: WorkerType): WorkerExecutionStrategy {
    const strategy = this.strategyByWorkerType[workerType];
    if (!strategy) {
      throw new Error(`Unsupported workerType: ${workerType}`);
    }
    return strategy;
  }

  private async ensureJobDoesNotExist(jobName: string): Promise<void> {
    if (await this.kubernetesService.checkIfJobExists(jobName)) {
      await this.kubernetesService.deleteJob(jobName);
    }
  }

  private async executeJobAndProcessResult(
    jobName: string,
    createJobFunction: () => Promise<KubernetesJobResult>,
    processLogResult: (log: string) => WorkerResponse,
  ): Promise<WorkerResponse> {
    await this.ensureJobDoesNotExist(jobName);

    const result = await createJobFunction();
    return processLogResult(result.message);
  }

  /**
   * @deprecated This method is deprecated in favor of `createWorkerWithInitContainer`, which uses an initialization container to set up the worker's environment. The old approach of passing all necessary data through environment variables and command arguments is prone to hitting Kubernetes limits on environment variable sizes and command lengths, especially for more complex worker definitions. The new init container strategy allows us to write the worker definition and any necessary files to a shared volume, which the main worker container can then access, thus bypassing these limitations.
   */
  async createSynchronousWorker(
    workerType: WorkerType,
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): Promise<WorkerResponse> {
    const strategy = this.getStrategy(workerType);
    const { imageName } = strategy.workerConfig;
    const jobName = this.getJobName(workerType);

    const createJobFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        imageName,
        strategy.buildJobCommand(createWorkerData, dependencies),
      );

    return this.executeJobAndProcessResult(
      jobName,
      createJobFunction,
      strategy.processLogResult,
    );
  }

  /**
   * Creates a worker with an initialization container.
   * The initialization container is responsible for writing the worker definition and any necessary files to a shared volume, which the main worker container can then access. This approach allows us to bypass Kubernetes' command length limitations and avoid issues with environment variable size limits.
   */
  async createWorkerWithInitContainer(
    jobName: string,
    workerType: WorkerType,
    createWorkerData: CreateWorkerDto,
  ): Promise<WorkerResponse> {
    const strategy = this.getStrategy(workerType);

    const { imageName, srcPath, testPath } = strategy.workerConfig;

    const workerPayload = strategy.buildWorkerPayload(
      createWorkerData,
      createWorkerData.dependencies ?? [],
    );

    const definitionWithPaths = {
      ...workerPayload,
      srcPath: workerPayload.srcPath || srcPath,
      testPath: workerPayload.testPath || testPath,
    };

    const sharedMounts = buildSharedEmptyDirMounts(
      definitionWithPaths.srcPath,
      definitionWithPaths.testPath,
    );

    this.logger.debug(
      `Creating worker with jobName: ${jobName} and definition: ${JSON.stringify(definitionWithPaths)}`,
    );

    const serializedDefinition = JSON.stringify(definitionWithPaths);
    const encodedDefinition =
      Buffer.from(serializedDefinition).toString('base64');

    // Delegate job options to the strategy when it implements buildJobOptions,
    // otherwise fall back to the default bootstrap init container setup.
    let jobOptions: KubernetesJobOptions;
    if (strategy.buildJobOptions) {
      jobOptions = strategy.buildJobOptions(
        encodedDefinition,
        createWorkerData.initSqlScript,
      );
    } else {
      jobOptions = this.buildDefaultJobOptions(sharedMounts, encodedDefinition);
    }

    this.logger.debug(
      `Job options for worker ${jobName}: ${JSON.stringify(jobOptions)}`,
    );

    const jobCommand = strategy.buildExecutionJobCommand(createWorkerData);

    const createJobFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        imageName,
        jobCommand,
        jobOptions,
      );

    return this.executeJobAndProcessResult(
      jobName,
      createJobFunction,
      strategy.processLogResult,
    );
  }

  async cancelWorkerJob(jobName: string): Promise<void> {
    await this.kubernetesService.deleteJobAndPods(jobName);
  }

  private getJobName(workerType: WorkerType): string {
    const strategy = this.getStrategy(workerType);
    const { jobPrefix } = strategy.workerConfig;
    return `${jobPrefix}-${Date.now()}`;
  }

  private buildDefaultJobOptions(
    sharedMounts: any,
    encodedDefinition: string,
  ): KubernetesJobOptions {
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
