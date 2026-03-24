import { WorkerType } from '../enum/worker-type.enum';
import { WorkerDefinition } from '../worker-definition.type';

export class CreateWorkerFromDefinitionDto {
  type: WorkerType;
  definition: WorkerDefinition;
}
