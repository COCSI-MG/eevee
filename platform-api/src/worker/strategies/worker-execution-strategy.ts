import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerResponse } from '../worker.interfaces';
import { WorkerType } from '../enum/worker-type.enum';
import { KubernetesJobOptions } from 'src/kubernetes/kubernetes.interfaces';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';

export interface WorkerConfig {
  jobPrefix: string;
  imageName: string;
  srcPath: string;
  testPath: string;
}

export interface WorkerExecutionStrategy {
  readonly workerType: WorkerType;
  readonly workerConfig: WorkerConfig;

  /**
   * @deprecated Use buildExecutionJobCommand instead. This method will still be used for backward compatibility, but it should not be used in new code. 
   */
  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[];

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[];

  buildWorkerPayload(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): WorkerJobPayload;

  processLogResult(log: string): WorkerResponse;

  buildJobOptions?(
    encodedDefinition: string,
    initSqlScript?: string,
  ): KubernetesJobOptions;
}
