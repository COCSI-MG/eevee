import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { ExamResponseDto } from './exam-response.dto';

export class CreateAssignmentAndLinkResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Assignment 1' })
  title: string;

  @ApiPropertyOptional({ example: 'Assignment description' })
  description?: string;

  @ApiProperty({ example: 5 })
  classId: number;

  @ApiProperty({ example: 3 })
  maxAttempts: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  dueDate?: Date | null;

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

  @ApiProperty({ example: 3 })
  score: number;

  @ApiProperty({ type: () => ExamResponseDto })
  exam: ExamResponseDto;
}
