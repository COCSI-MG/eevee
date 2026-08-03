import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';

export class CreateSchedulingJobMessageDto {
  attemptId!: number;
  userId!: number;
  workerData!: CreateWorkerDto;
}
