import { Injectable } from '@nestjs/common';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFFIX } from './worker.constants';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerResponse } from './worker.interfaces';
import { WorkerType } from './enum/worker-type.enum';
import { KubernetesJobResult } from 'src/kubernetes/kubernetes.interfaces';

import { ArtifactsService } from 'src/artifacts/artifacts.service';
import { buildWorkerArtifactFiles } from 'src/artifacts/artifact-builder';
import { ARTIFACT_ENV_VAR_NAME } from 'src/artifacts/artifacts.constants';

import { WorkerExecutionStrategy } from './strategies/worker-execution-strategy';
import { NodeDefaultJestStrategy } from './strategies/node-default-jest.strategy';
import { NodeGrpcJsJestStrategy } from './strategies/node-grpcjs-jest.strategy';
import { NodeNestJsStrategy } from './strategies/node-nestjs.strategy';
import { NodeNextJsCypressStrategy } from './strategies/node-nextjs-cypress.strategy';

@Injectable()
export class WorkerService {
  constructor(
    private readonly kubernetesService: KubernetesService,
    private readonly artifactsService: ArtifactsService,
  ) {}

  private readonly strategyByWorkerType: Record<
    WorkerType,
    WorkerExecutionStrategy
  > = {
    [WorkerType.NODE_DEFAULT]: new NodeDefaultJestStrategy(),
    [WorkerType.NODE_GRPCJS]: new NodeGrpcJsJestStrategy(),
    [WorkerType.NODE_NESTJS]: new NodeNestJsStrategy(),
    [WorkerType.NODE_NEXTJS_CYPRESS]: new NodeNextJsCypressStrategy(),
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

    const artifactFiles = buildWorkerArtifactFiles(
      workerType,
      createWorkerData,
    );
    const { url: artifactUrl } =
      await this.artifactsService.uploadArtifactAndPresignUrl({
        key: `jobs/${jobName}/artifact.tar.gz`,
        files: artifactFiles,
      });

    const createWorkerFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        WORKER_IMAGE_NAMES[workerType],
        strategy.buildJobCommand(createWorkerData, dependencies),
        {
          [ARTIFACT_ENV_VAR_NAME]: artifactUrl,
        },
      );

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      strategy.processLogResult,
      true,
    );

    return <WorkerResponse>result;
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
}
