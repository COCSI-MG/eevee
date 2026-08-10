import { WorkerExecutionStrategy, WorkerConfig } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { NodeNextJsCypressStrategy } from './node-nextjs-cypress.strategy';
import { parseCypressLogResultFromTestEnvelope } from './worker-log-parsers';
import { WORKER_IMAGE_NAMES, WORKER_JOB_PREFIX } from '../worker.constants';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';

export class NodeReactJsCypressIsolatedLogStrategy
  implements WorkerExecutionStrategy
{
  readonly workerType = WorkerType.NODE_REACTJS_CYPRESS;

  readonly workerConfig: WorkerConfig = {
    jobPrefix: WORKER_JOB_PREFIX[WorkerType.NODE_REACTJS_CYPRESS],
    imageName: WORKER_IMAGE_NAMES[WorkerType.NODE_REACTJS_CYPRESS],
    srcPath: '/app/src',
    testPath: '/app/cypress/e2e',
  };

  private readonly baseStrategy = new NodeNextJsCypressStrategy();

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    return this.baseStrategy.buildJobCommand(createWorkerData, dependencies);
  }

  buildExecutionJobCommand(createWorkerData: CreateWorkerDto): string[] {
    return this.baseStrategy.buildExecutionJobCommand(createWorkerData);
  }

  buildWorkerPayload(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): WorkerJobPayload {
    return this.baseStrategy.buildWorkerPayload(createWorkerData, dependencies);
  }

  processLogResult = parseCypressLogResultFromTestEnvelope;
}
