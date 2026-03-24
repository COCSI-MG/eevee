import { WorkerExecutionStrategy } from './worker-execution-strategy';
import { WorkerType } from '../enum/worker-type.enum';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { NodeNextJsCypressStrategy } from './node-nextjs-cypress.strategy';
import { parseCypressLogResultFromTestEnvelope } from './worker-log-parsers';

export class NodeReactJsCypressIsolatedLogStrategy
  implements WorkerExecutionStrategy
{
  readonly workerType = WorkerType.NODE_REACTJS_CYPRESS;

  private readonly baseStrategy = new NodeNextJsCypressStrategy();

  buildJobCommand(
    createWorkerData: CreateWorkerDto,
    dependencies: string[],
  ): string[] {
    return this.baseStrategy.buildJobCommand(createWorkerData, dependencies);
  }

  processLogResult = parseCypressLogResultFromTestEnvelope;
}
