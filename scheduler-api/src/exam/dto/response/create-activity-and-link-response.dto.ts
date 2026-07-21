import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { ExamResponseDto } from './exam-response.dto';

export class CreateActivityAndLinkResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Activity 1' })
  title: string;

  @ApiPropertyOptional({ example: 'Activity description' })
  description?: string;

  @ApiProperty({ example: 5 })
  classId: number;

  @ApiProperty({ example: 3 })
  maxAttempts: number;

  @ApiProperty({ enum: WorkerType, example: WorkerType.NODE_DEFAULT })
  workerType: WorkerType;

  @ApiPropertyOptional()
  initSqlScript?: string;

  @ApiPropertyOptional()
  boilerplate?: string;

  @ApiPropertyOptional()
  boilerplateContent?: string;

  @ApiPropertyOptional()
  validationScript?: string;

  @ApiProperty({ type: () => ExamResponseDto })
  exam: ExamResponseDto;
}
