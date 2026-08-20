import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { ExamResponseDto } from './exam-response.dto';

export class AssignmentAttemptSummaryDto {
  @ApiProperty({ example: 999 })
  id: number;

  @ApiProperty({ example: 1 })
  attempt: number;

  @ApiProperty({ enum: AttemptStatus, example: AttemptStatus.COMPLETED })
  status: AttemptStatus;

  @ApiProperty({ example: 91.5 })
  score: number;

  @ApiProperty({ example: true })
  isAcceptable: boolean;

  @ApiProperty({ example: 8 })
  passes: number;

  @ApiProperty({ example: 1 })
  fails: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class AssignmentUserSuspensionSummaryDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'Cheating detected', nullable: true })
  reason: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

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

  @ApiProperty({ type: () => AssignmentAttemptSummaryDto, nullable: true })
  lastAttempt: AssignmentAttemptSummaryDto | null;

  @ApiProperty({ type: () => [AssignmentUserSuspensionSummaryDto] })
  suspensions: AssignmentUserSuspensionSummaryDto[];

  @ApiProperty({ example: 3 })
  score: number;
}

export class ExamWithAssignmentsResponseDto {
  @ApiProperty({ type: () => ExamResponseDto })
  exam: ExamResponseDto;

  @ApiProperty({ type: () => [AssignmentSummaryResponseDto] })
  assignments: AssignmentSummaryResponseDto[];
}
