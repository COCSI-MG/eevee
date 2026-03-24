import { Injectable, Logger } from '@nestjs/common';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import {
  WORKER_DEFINITION_B64_ENV_NAME,
  WORKER_IMAGE_NAMES,
  WORKER_JOB_PREFFIX,
} from './worker.constants';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerResponse } from './worker.interfaces';
import { WorkerType } from './enum/worker-type.enum';
import {
  KubernetesJobOptions,
  KubernetesJobResult,
} from 'src/kubernetes/kubernetes.interfaces';

import { WorkerExecutionStrategy } from './strategies/worker-execution-strategy';
import { NodeDefaultJestStrategy } from './strategies/node-default-jest.strategy';
import { NodeGrpcJsJestStrategy } from './strategies/node-grpcjs-jest.strategy';
import { NodeNestJsStrategy } from './strategies/node-nestjs.strategy';
import { NodeNextJsCypressStrategy } from './strategies/node-nextjs-cypress.strategy';
import { NodeReactJsCypressIsolatedLogStrategy } from './strategies/node-reactjs-cypress-isolated-log.strategy';
import { CreateWorkerFromDefinitionDto } from './dto/create-worker-from-definition.dto';
import { normalizeTemplateImportPaths } from 'src/utils/template-import-path.utils';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(private readonly kubernetesService: KubernetesService) {}

  private readonly DEFAULT_SRC_PATH = '/app/workspace/src';

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
  };

  private async createWorker(
    jobName: string,
    createJobFunction: () => Promise<KubernetesJobResult | void>,
    processLogResult: (log: string) => WorkerResponse,
    wait: boolean = false,
  ) {
    if (await this.kubernetesService.checkIfJobExists(jobName)) {
      await this.kubernetesService.deleteJob(jobName);
    }

    const result: KubernetesJobResult | void = await createJobFunction();

    if (!wait) return result;

    const log = (<KubernetesJobResult>result).message;

    return processLogResult(log);
  }

  private async defaultSynchronousWorkerOperations(
    workerType: WorkerType,
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    const jobName = `${WORKER_JOB_PREFFIX[workerType]}${Date.now()}`;

    const strategy = this.strategyByWorkerType[workerType];
    if (!strategy) {
      throw new Error(`Unsupported workerType: ${workerType}`);
    }

    const createWorkerFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        WORKER_IMAGE_NAMES[workerType],
        strategy.buildJobCommand(createWorkerData, dependencies),
      );

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      strategy.processLogResult,
      true,
    );

    return <WorkerResponse>result;
  }

  private getWorkerConstantsByType(type: WorkerType) {
    switch (type) {
      case WorkerType.NODE_DEFAULT:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.node_default,
          imageName: WORKER_IMAGE_NAMES.node_default,
          srcPath: this.DEFAULT_SRC_PATH,
          testPath: '/app/workspace/test',
        };

      case WorkerType.NODE_NESTJS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.node_nestjs,
          imageName: WORKER_IMAGE_NAMES.node_nestjs,
          srcPath: this.DEFAULT_SRC_PATH,
          testPath: '/app/workspace/test',
        };

      case WorkerType.NODE_GRPCJS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.node_grpcjs,
          imageName: WORKER_IMAGE_NAMES.node_grpcjs,
          srcPath: this.DEFAULT_SRC_PATH,
          testPath: '/app/workspace/test',
        };

      case WorkerType.NODE_NEXTJS_CYPRESS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.node_nextjs_cypress,
          imageName: WORKER_IMAGE_NAMES.node_nextjs_cypress,
          srcPath: this.DEFAULT_SRC_PATH,
          testPath: '/app/workspace/cypress/e2e',
        };

      case WorkerType.NODE_REACTJS_CYPRESS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.node_reactjs_cypress,
          imageName: WORKER_IMAGE_NAMES.node_reactjs_cypress,
          srcPath: this.DEFAULT_SRC_PATH,
          testPath: '/app/workspace/cypress/e2e',
        };

      default:
        throw new Error(`Unsupported worker type: ${type}`);
    }
  }

  async createGrpcJsWorkerAndWait(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    return this.defaultSynchronousWorkerOperations(
      WorkerType.NODE_GRPCJS,
      createWorkerData,
      dependencies,
    );
  }

  async createDefaultNodeWorkerAndWait(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    return this.defaultSynchronousWorkerOperations(
      WorkerType.NODE_DEFAULT,
      createWorkerData,
      dependencies,
    );
  }

  async createNestJsWorkerAndWait(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    return this.defaultSynchronousWorkerOperations(
      WorkerType.NODE_NESTJS,
      createWorkerData,
      dependencies,
    );
  }

  async createNextJsCypressWorkerAndWait(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    return this.defaultSynchronousWorkerOperations(
      WorkerType.NODE_NEXTJS_CYPRESS,
      createWorkerData,
      dependencies,
    );
  }

  async createWorkerFromDefinition(
    jobKey: string,
    data: CreateWorkerFromDefinitionDto,
  ): Promise<WorkerResponse> {
    const { definition, type } = data;

    const workerConstants = this.getWorkerConstantsByType(type);
    const definitionWithPaths = {
      ...definition,
      srcPath: definition.srcPath || workerConstants.srcPath,
      testPath: definition.testPath || workerConstants.testPath,
    };

    const normalizedTestFiles = Object.fromEntries(
      Object.entries(definitionWithPaths.testFiles ?? {}).map(
        ([fileName, content]) => [
          fileName,
          normalizeTemplateImportPaths({
            content,
            srcPath: definitionWithPaths.srcPath,
            testPath: definitionWithPaths.testPath,
          }),
        ],
      ),
    );

    definitionWithPaths.testFiles = normalizedTestFiles;

    const jobName = `${workerConstants.jobPrefix}-${jobKey}`;

    const jobExists = await this.kubernetesService.checkIfJobExists(jobName);
    if (jobExists) {
      await this.kubernetesService.deleteJob(jobName);
    }

    this.logger.debug(
      `Creating worker with jobName: ${jobName} and definition: ${JSON.stringify(definitionWithPaths)}`,
    );

    const serializedDefinition = JSON.stringify(definitionWithPaths);
    const encodedDefinition =
      Buffer.from(serializedDefinition).toString('base64');

    const jobOptions: KubernetesJobOptions = {
      sharedEmptyDir: {
        volumeName: 'worker-app-volume',
        mountPath: '/app/workspace', // Path inside the container where the shared volume will be mounted, all workers will read/write to this path
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

    this.logger.debug(
      `Job options for worker ${jobName}: ${JSON.stringify(jobOptions)}`,
    );

    const createWorkerFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        workerConstants.imageName,
        [],
        jobOptions,
      );

    const strategy = this.strategyByWorkerType[type];

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      strategy.processLogResult,
      true,
    );

    return <WorkerResponse>result;
  }
}
