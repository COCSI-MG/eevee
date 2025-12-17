import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerResponse } from '../worker.interfaces';
import { WorkerType } from '../enum/worker-type.enum';

export interface WorkerExecutionStrategy {
  readonly workerType: WorkerType;

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[];

  processLogResult(log: string): WorkerResponse;
}
