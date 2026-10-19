import { WorkerType } from 'src/worker/enum/worker-type.enum';

export interface BaseAssignmentDto {
  id: number;
  title: string;
  description: string;
  workerType: WorkerType;
  startDate?: Date | null;
  dueDate?: Date | null;
}
