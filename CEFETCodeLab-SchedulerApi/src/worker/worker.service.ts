import { Injectable } from '@nestjs/common';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import {
  WORKER_DEFAULT_INPUT_PATH,
  WORKER_IDENTIFYING_CHARS,
  WORKER_IMAGE_NAMES,
  WORKER_JOB_PREFFIX,
} from './worker.constants';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerResponse } from './worker.interfaces';
import { KubernetesJobResult } from 'src/kubernetes/kubernetes.interfaces';
import { CreateWorkerFromDefinitionDto } from './dto/create-worker-from-definition.dto';
import { WorkerType } from './enum/worker-type.enum';

@Injectable()
export class WorkerService {
  constructor(private readonly kubernetesService: KubernetesService) {}

  private buildCreateFilesDefaultAndStartCommand(
    applicationFileContent: string,
    testFilesContent: string[],
    templateDependencies: string[],
  ): string[] {
    const commands: string[] = [];

    const encodedApp = Buffer.from(applicationFileContent).toString('base64');
    commands.push(`echo "${encodedApp}" | base64 -d > /app/app.ts`);

    testFilesContent.forEach((testContent, index) => {
      const encodedTest = Buffer.from(testContent).toString('base64');
      const fileName = `/app/validation${index}.test.ts`;
      commands.push(`echo "${encodedTest}" | base64 -d > ${fileName}`);
    });

    if (templateDependencies.length) {
      const deps = templateDependencies.join(' ');
      commands.push(`npm install ${deps}`);
    }

    commands.push(`npm start`);

    return ['/bin/sh', '-c', commands.join(' && ')];
  }

  private buildCreateFilesNestJsAndStartCommand(
    applicationFileContent: string,
    testFilesContent: string[],
    templateDependencies: string[],
  ): string[] {
    const commands: string[] = [];

    const encodedApp = Buffer.from(applicationFileContent).toString('base64');
    commands.push(`echo "${encodedApp}" | base64 -d > /app/src/app.module.ts`);

    testFilesContent.forEach((testContent, index) => {
      const encodedTest = Buffer.from(testContent).toString('base64');
      const fileName = `/app/test/validation${index}.e2e-spec.ts`;
      commands.push(`echo "${encodedTest}" | base64 -d > ${fileName}`);
    });

    if (templateDependencies.length) {
      const deps = templateDependencies.join(' ');
      commands.push(`npm install ${deps}`);
    }

    commands.push(`npm run start:worker`);

    return ['/bin/sh', '-c', commands.join(' && ')];
  }

  private getWorkerConstantsByType(type: WorkerType) {
    switch (type) {
      case WorkerType.NODE_DEFAULT:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.NODE_DEFAULT,
          imageName: WORKER_IMAGE_NAMES.NODE_DEFAULT,
          testFileSufix: 'spec.ts',
        };

      case WorkerType.NODE_NESTJS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.NODE_NESTJS,
          imageName: WORKER_IMAGE_NAMES.NODE_NESTJS,
          testFileSufix: 'spec.ts',
        };

      case WorkerType.REACTJS_CYPRESS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.REACT_CYPRESS,
          imageName: WORKER_IMAGE_NAMES.REACT_CYPRESS,
          testFileSufix: 'cy.ts',
        };

      case WorkerType.NEXTJS_CYPRESS:
        return {
          jobPrefix: WORKER_JOB_PREFFIX.NEXTJS_CYPRESS,
          imageName: WORKER_IMAGE_NAMES.NEXTJS_CYPRESS,
          testFileSufix: 'cy.ts',
        };

      default:
        throw new Error(`Unsupported worker type: ${type}`);
    }
  }

  private processLogResult(log: string): WorkerResponse {
    const jsonStatsMatch = log.match(/"stats"\s*:\s*\{[\s\S]*?\}/);
    if (jsonStatsMatch) {
      const stats = jsonStatsMatch[0];
      const passedMatch = stats.match(/"passes"\s*:\s*(\d+)/);
      const failuresMatch = stats.match(/"failures"\s*:\s*(\d+)/);

      if (passedMatch && failuresMatch) {
        return {
          failures: parseInt(failuresMatch[1], 10),
          passes: parseInt(passedMatch[1], 10),
          completeTrace: log,
        };
      }
    }

    const logLines = log.split('\n');

    const testSummaryLine = logLines.find((line) => line.includes('Tests:'));

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

  async createDefaultNodeWorkerAndWait(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
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
          dependencies,
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

  async createNestJsWorkerAndWait(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    const jobName = `${WORKER_JOB_PREFFIX.NODE_NESTJS}${Date.now()}`;
    if (await this.kubernetesService.checkIfJobExists(jobName)) {
      await this.kubernetesService.deleteJob(jobName);
    }

    const createWorkerFunction = () =>
      this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        WORKER_IMAGE_NAMES.NODE_NESTJS,
        this.buildCreateFilesNestJsAndStartCommand(
          createWorkerData.applicationFileContent,
          createWorkerData.testFilesContent,
          dependencies,
        ),
      );

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      this.processLogResult,
      true,
    );

    console.log('Result:', result);

    return <WorkerResponse>result;
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

    await this.kubernetesService.deleteConfigMap(configMapName);

    const configMap: {
      name: string;
      volumeName: string;
      mountPath: string;
    }[] = [];

    const testsConfigMapName = `${jobName}-tests-configmap`;
    await this.kubernetesService.deleteConfigMap(testsConfigMapName);

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

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      this.processLogResult,
      true,
    );

    return <WorkerResponse>result;
  }
}
