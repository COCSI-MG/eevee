import { Injectable } from '@nestjs/common';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { WORKER_DEFAULT_INPUT_PATH, WORKER_IMAGE_NAMES, WORKER_JOB_PREFFIX } from './worker.constants';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerResponse } from './worker.interfaces';
import { WorkerType } from './enum/worker-type.enum';
import { KubernetesJobResult } from 'src/kubernetes/kubernetes.interfaces';

import { WorkerExecutionStrategy } from './strategies/worker-execution-strategy';
import { NodeDefaultJestStrategy } from './strategies/node-default-jest.strategy';
import { NodeGrpcJsJestStrategy } from './strategies/node-grpcjs-jest.strategy';
import { NodeNestJsStrategy } from './strategies/node-nestjs.strategy';
import { NodeNextJsCypressStrategy } from './strategies/node-nextjs-cypress.strategy';
import { CreateWorkerFromDefinitionDto } from './dto/create-worker-from-definition.dto';

@Injectable()
export class WorkerService {
  constructor(private readonly kubernetesService: KubernetesService) { }

  private readonly strategyByWorkerType: Record<
    WorkerType,
    WorkerExecutionStrategy
  > = {
      [WorkerType.NODE_DEFAULT]: new NodeDefaultJestStrategy(),
      [WorkerType.NODE_GRPCJS]: new NodeGrpcJsJestStrategy(),
      [WorkerType.NODE_NESTJS]: new NodeNestJsStrategy(),
      [WorkerType.NODE_NEXTJS_CYPRESS]: new NodeNextJsCypressStrategy(),
      [WorkerType.REACTJS_CYPRESS]: new NodeNextJsCypressStrategy(), // implement 
      [WorkerType.NEXTJS_CYPRESS]: new NodeNextJsCypressStrategy(), // implement
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
          testFileSufix: 'spec.ts',
        };

      case WorkerType.NODE_NESTJS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.node_nestjs,
          imageName: WORKER_IMAGE_NAMES.node_nestjs,
          testFileSufix: 'spec.ts',
        };

      case WorkerType.REACTJS_CYPRESS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.reactjs_cypress,
          imageName: WORKER_IMAGE_NAMES.reactjs_cypress,
          testFileSufix: 'cy.ts',
        };

      case WorkerType.NEXTJS_CYPRESS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.nextjs_cypress,
          imageName: WORKER_IMAGE_NAMES.nextjs_cypress,
          testFileSufix: 'cy.ts',
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
    const { definition, type, testFilesContent } = data;

    const workerConstants = this.getWorkerConstantsByType(type);
    const jobName = `${workerConstants.jobPrefix}-${jobKey}`;
    const configMapName = `${jobName}-configmap`;

    const jobExists = await this.kubernetesService.checkIfJobExists(jobName);
    if (jobExists) {
      await this.kubernetesService.deleteJob(jobName);
    }

    const configMap: {
      name: string;
      volumeName: string;
      mountPath: string;
    }[] = [];

    const testsConfigMapName = `${jobName}-tests-configmap`;

    const testsConfigMapData: Record<string, string> = {};
    if (testFilesContent) {
      testFilesContent.forEach((testContent, index) => {
        const fileName = `${index++}-template.${workerConstants.testFileSufix}`;
        testsConfigMapData[fileName] = testContent;
      });

      await this.kubernetesService.createConfigMap(
        testsConfigMapName,
        testsConfigMapData,
      );

      configMap.push({
        name: testsConfigMapName,
        volumeName: 'worker-tests-volume',
        mountPath: `${WORKER_DEFAULT_INPUT_PATH}/tests`,
      });
    }

    const configMapData: Record<string, string> = {
      'worker-definition.json': JSON.stringify(definition),
    };

    await this.kubernetesService.createConfigMap(configMapName, configMapData);

    configMap.push({
      name: configMapName,
      volumeName: 'worker-definition-volume',
      mountPath: WORKER_DEFAULT_INPUT_PATH,
    });

    const createWorkerFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        workerConstants.imageName,
        [],
        configMap,
      );

    const strategy = this.strategyByWorkerType[type];

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      strategy.processLogResult,
      true,
    );

    // deletendo config maps após a execução do job
    await Promise.all([
      this.kubernetesService.deleteConfigMap(configMapName),
      this.kubernetesService.deleteConfigMap(testsConfigMapName),
    ]);

    return <WorkerResponse>result;
  }
}
