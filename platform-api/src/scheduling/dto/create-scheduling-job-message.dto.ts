import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class CreateSchedulingJobMessageDto {
  attemptId!: number;
  userId!: number;
  workerType!: WorkerType;
  workerData!: CreateWorkerDto;
}
