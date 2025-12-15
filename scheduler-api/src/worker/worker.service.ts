import { Injectable } from '@nestjs/common';
import { KubernetesService } from 'src/kubernetes/kubernetes.service';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFFIX } from './worker.constants';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerResponse } from './worker.interfaces';
import { WorkerType } from './enum/worker-type.enum';
import { KubernetesJobResult } from 'src/kubernetes/kubernetes.interfaces';
import { WorkerTestFile } from './worker.interfaces';

interface BuildDefaultWorkerCommandOptions {
  applicationFileContent: string;
  testFilesContent: string[];
  templateDependencies: string[];
  applicationEntryFilePath: string;
  testFilePathBuilder: (index: number) => string;
  testFiles?: WorkerTestFile[];
  templateVariablesModuleContent?: string;
  templateVariablesModulePath?: string;
}

interface BuildNestWorkerCommandOptions {
  applicationFileContent: string;
  testFilesContent: string[];
  templateDependencies: string[];
  testFiles?: WorkerTestFile[];
  templateVariablesModuleContent?: string;
  templateVariablesModulePath?: string;
}

@Injectable()
export class WorkerService {
  constructor(private readonly kubernetesService: KubernetesService) {}

  private normalizeTestFiles(
    testFilesContent: string[],
    testFiles?: WorkerTestFile[],
  ) {
    if (testFiles && testFiles.length) return testFiles;
    return testFilesContent.map((content, index) => ({
      templateId: index,
      type: 'legacy',
      content,
    }));
  }

  private buildCreateFilesDefaultAndStartCommand(
    options: BuildDefaultWorkerCommandOptions,
  ): string[] {
    const commands: string[] = [];

    const encodedApp = Buffer.from(options.applicationFileContent).toString(
      'base64',
    );
    commands.push(
      `echo "${encodedApp}" | base64 -d > ${options.applicationEntryFilePath}`,
    );

    // Compatibility shim for the gRPC worker image.
    // That image expects the student's entry file to be `/app/server.ts`, but older/default
    // teacher templates import student exports from `./app`. Provide `/app/app.ts` that
    // re-exports from `./server` so both styles work.
    if (options.applicationEntryFilePath === '/app/server.ts') {
      const shim = Buffer.from("export * from './server';\n").toString('base64');
      commands.push(`echo "${shim}" | base64 -d > /app/app.ts`);
    }

    const normalizedTestFiles = this.normalizeTestFiles(
      options.testFilesContent,
      options.testFiles,
    );

    if (options.templateVariablesModulePath) {
      const moduleContent = options.templateVariablesModuleContent ?? '';
      const encodedModule = Buffer.from(moduleContent).toString('base64');
      commands.push(
        `echo "${encodedModule}" | base64 -d > ${options.templateVariablesModulePath}`,
      );
    }

    normalizedTestFiles.forEach((testFile, index) => {
      const encodedTest = Buffer.from(testFile.content).toString('base64');
      const fileName = options.testFilePathBuilder(index);
      commands.push(`echo "${encodedTest}" | base64 -d > ${fileName}`);
    });

    if (options.templateDependencies.length) {
      const deps = options.templateDependencies.join(' ');
      commands.push(`npm install ${deps}`);
    }

    commands.push(`npm start`);

    return ['/bin/sh', '-c', commands.join(' && ')];
  }
  private buildCreateFilesNestJsAndStartCommand(
    options: BuildNestWorkerCommandOptions,
  ): string[] {
    const commands: string[] = [];

    const templateVariablesModulePath =
      options.templateVariablesModulePath ?? '/app/test/template-variables.ts';

    const encodedApp = Buffer.from(options.applicationFileContent).toString(
      'base64',
    );
    commands.push(`echo "${encodedApp}" | base64 -d > /app/src/app.module.ts`);

    const moduleContent = options.templateVariablesModuleContent ?? '';
    const encodedModule = Buffer.from(moduleContent).toString('base64');
    commands.push(
      `echo "${encodedModule}" | base64 -d > ${templateVariablesModulePath}`,
    );

    const normalizedTestFiles = this.normalizeTestFiles(
      options.testFilesContent,
      options.testFiles,
    );

    normalizedTestFiles.forEach((testFile, index) => {
      const encodedTest = Buffer.from(testFile.content).toString('base64');
      const fileName = `/app/test/validation${index}.e2e-spec.ts`;
      commands.push(`echo "${encodedTest}" | base64 -d > ${fileName}`);
    });

    if (options.templateDependencies.length) {
      const deps = options.templateDependencies.join(' ');
      commands.push(`npm install ${deps}`);
    }

    commands.push(`npm run start:worker`);

    return ['/bin/sh', '-c', commands.join(' && ')];
  }

  private processLogResult(log: string): WorkerResponse {
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

  private async defaultSynchronousWorkerOperations(
    workerType: WorkerType,
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ) {
    const jobName = `${WORKER_JOB_PREFFIX[workerType]}${Date.now()}`;
    if (await this.kubernetesService.checkIfJobExists(jobName)) {
      await this.kubernetesService.deleteJob(jobName);
    }

    const createWorkerFunction = () => {
      if (workerType === WorkerType.NODE_NESTJS) {
        return this.kubernetesService.createAndWaitForJobCompletion(
          jobName,
          WORKER_IMAGE_NAMES[workerType],
          this.buildCreateFilesNestJsAndStartCommand({
            applicationFileContent: createWorkerData.applicationFileContent,
            testFilesContent: createWorkerData.testFilesContent,
            templateDependencies: dependencies,
            testFiles: createWorkerData.testFiles,
            templateVariablesModuleContent:
              createWorkerData.templateVariablesModuleContent,
          }),
        );
      }

      const applicationEntryFilePath =
        workerType === WorkerType.NODE_GRPCJS
          ? '/app/server.ts'
          : '/app/app.ts';

      const templateVariablesModulePath = '/app/template-variables.ts';

      return this.kubernetesService.createAndWaitForJobCompletion(
        jobName,
        WORKER_IMAGE_NAMES[workerType],
        this.buildCreateFilesDefaultAndStartCommand({
          applicationFileContent: createWorkerData.applicationFileContent,
          testFilesContent: createWorkerData.testFilesContent,
          templateDependencies: dependencies,
          applicationEntryFilePath,
          testFilePathBuilder: (index) => `/app/validation${index}.test.ts`,
          testFiles: createWorkerData.testFiles,
          templateVariablesModuleContent:
            createWorkerData.templateVariablesModuleContent,
          templateVariablesModulePath,
        }),
      );
    };

    const result = await this.createWorker(
      jobName,
      createWorkerFunction,
      this.processLogResult,
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
}
