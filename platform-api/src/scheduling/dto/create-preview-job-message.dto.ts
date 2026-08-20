import { CreateSchedulingDto } from './create-scheduling.dto';

export class CreatePreviewJobMessageDto {
  previewRunId!: number;
  userId!: number;
  createSchedulingDto!: CreateSchedulingDto;
}
