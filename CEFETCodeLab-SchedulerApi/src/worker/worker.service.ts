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
  testFilesContent: string[],
  dependencies: string[]
): string[] {
  const commands: string[] = [];

  const encodedApp = Buffer.from(applicationFileContent).toString('base64');
  commands.push(`echo "${encodedApp}" | base64 -d > /app/app.ts`);

  testFilesContent.forEach((testContent, index) => {
    const encodedTest = Buffer.from(testContent).toString('base64');
    const fileName = `/app/validation${index}.test.ts`;
    commands.push(`echo "${encodedTest}" | base64 -d > ${fileName}`);
  });

  commands.push(`npm install mathjs`);
  commands.push(`npm start`);

  return ['/bin/sh', '-c', commands.join(' && ')];
}
  private buildCreateFilesNestJsAndStartCommand(
    applicationFileContent: string,
    testFileContent: string[],
  ): string[] {
    return [
      '/bin/sh',
      '-c',
      `echo "${testFileContent}" > /app/test/app.e2e-spec.ts && echo "${applicationFileContent}" > /app/src/app.module.ts && npm run start:worker`,
    ];
  }

  private processLogResult(log: string): WorkerResponse {
    const logLines = log.split('\n');

      const testSummaryLine = logLines.find((line) =>
        line.includes('Tests:')
      );

      let passedCount = 0;
      let totalCount = 0;

      if (testSummaryLine) {
        const passedMatch = testSummaryLine.match(/(\d+)\s+passed/);
        const totalMatch = testSummaryLine.match(/(\d+)\s+total/);

        if (passedMatch) passedCount = parseInt(passedMatch[1], 10);
        if (totalMatch) totalCount = parseInt(totalMatch[1], 10);
      }
    return {
      failures: totalCount - passedCount,
      passes: passedCount,
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
          createWorkerData.testFilesContent,
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
          createWorkerData.testFilesContent,
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
