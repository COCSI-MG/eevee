import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { ExamResponseDto } from './exam-response.dto';

export class AssignmentSummaryResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Assignment 1' })
  title: string;

  @ApiPropertyOptional({ example: 'Assignment description' })
  description?: string;

  @ApiProperty({ example: 5 })
  classId: number;

  @ApiProperty({ example: 3 })
  maxAttempts: number;

  @ApiProperty({ enum: WorkerType, example: WorkerType.NODE_DEFAULT })
  workerType: WorkerType;
}

export class ExamWithAssignmentsResponseDto {
  @ApiProperty({ type: () => ExamResponseDto })
  exam: ExamResponseDto;

  @ApiProperty({ type: () => [AssignmentSummaryResponseDto] })
  assignments: AssignmentSummaryResponseDto[];
}
