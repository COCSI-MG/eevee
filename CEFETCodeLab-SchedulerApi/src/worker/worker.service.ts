import { Injectable } from '@nestjs/common';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import {
  WORKER_IDENTIFYING_CHARS,
  WORKER_IMAGE_NAMES,
  WORKER_JOB_PREFFIX,
} from './worker.constants';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerResponse } from './worker.interfaces';
import { KubernetesJobResult } from 'src/kubernetes/kubernetes.interfaces';

@Injectable()
export class WorkerService {
  constructor(private readonly kubernetesService: KubernetesService) {}
  private buildCreateFilesDefaultAndStartCommand(
    applicationFileContent: string,
    testFileContent: string,
  ): string[] {
    return [
      '/bin/sh',
      '-c',
      `echo "${testFileContent}" > /app/validation.test.ts && echo "${applicationFileContent}" > /app/app.ts && npm start`,
    ];
  }

  private buildCreateFilesNestJsAndStartCommand(
    applicationFileContent: string,
    testFileContent: string,
  ): string[] {
    return [
      '/bin/sh',
      '-c',
      `echo "${testFileContent}" > /app/test/app.e2e-spec.ts && echo "${applicationFileContent}" > /app/src/app.module.ts && npm run start:worker`,
    ];
  }

  private processLogResult(log: string): WorkerResponse {
    const logLines = log.split('\n');
    const successLines = logLines
      .filter((line) => line.includes(WORKER_IDENTIFYING_CHARS.SUCCESS))
      .map((line) => line.trim());
    const failureLines = logLines
      .filter((line) => line.includes(WORKER_IDENTIFYING_CHARS.FAILURE))
      .map((line) => line.trim());
    return {
      failures: failureLines,
      passes: successLines,
      completeTrace: log,
    };
  }

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

  // async createDefaultNodeWorker(createWorkerData: CreateWorkerDto) {
  //   const jobName = `${WORKER_JOB_PREFFIX.NODE_DEFAULT}${Date.now()}`;
  //   if (await this.kubernetesService.checkIfJobExists(jobName)) {
  //     await this.kubernetesService.deleteJob(jobName);
  //   }

  //   const createWorkerFunction = () =>
  //     this.kubernetesService.createJob(
  //       jobName,
  //       WORKER_IMAGE_NAMES.NODE_DEFAULT,
  //       this.buildCreateFilesDefaultAndStartCommand(
  //         createWorkerData.applicationFileContent,
  //         createWorkerData.testFileContent,
  //       ),
  //     );

  //   const result = await this.createWorker(
  //     jobName,
  //     createWorkerFunction,
  //     this.processLogResult,
  //   );

  //   return <void>result;
  // }

  async createDefaultNodeWorkerAndWait(createWorkerData: CreateWorkerDto) {
    const jobName = `${WORKER_JOB_PREFFIX.NODE_DEFAULT}${Date.now()}`;
    if (await this.kubernetesService.checkIfJobExists(jobName)) {
      await this.kubernetesService.deleteJob(jobName);
    }

    const createWorkerFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        WORKER_IMAGE_NAMES.NODE_DEFAULT,
        this.buildCreateFilesDefaultAndStartCommand(
          createWorkerData.applicationFileContent,
          createWorkerData.testFileContent,
        ),
      );

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      this.processLogResult,
      true,
    );

    return <WorkerResponse>result;
  }

  async createNestJsWorkerAndWait(createWorkerData: CreateWorkerDto) {
    const jobName = `${WORKER_JOB_PREFFIX.NODE_NESTJS}${Date.now()}`;
    if (await this.kubernetesService.checkIfJobExists(jobName)) {
      await this.kubernetesService.deleteJob(jobName);
    }

    const createWorkerFunction = () =>
      this.kubernetesService.createJob(
        jobName,
        WORKER_IMAGE_NAMES.NODE_NESTJS,
        this.buildCreateFilesNestJsAndStartCommand(
          createWorkerData.applicationFileContent,
          createWorkerData.testFileContent,
        ),
      );

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      this.processLogResult,
    );

    return <WorkerResponse>result;
  }
}
