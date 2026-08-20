import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttemptStatus } from 'src/attempt/enums/attempt-status.enum';

export class ExamStudentLastAttemptDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ enum: AttemptStatus, example: AttemptStatus.COMPLETED })
  status: AttemptStatus;

  @ApiProperty({ example: 1.0 })
  score: number;

  @ApiProperty({ example: true })
  isAcceptable: boolean;

  @ApiProperty({ example: 2 })
  passes: number;

  @ApiProperty({ example: 0 })
  fails: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class ExamStudentAssignmentDto {
  @ApiProperty({ example: 7 })
  assignmentId: number;

  @ApiProperty({ example: 'Ranking de Alunos' })
  title: string;

  @ApiProperty({ example: 2.0 })
  weight: number;

  @ApiProperty({ example: true })
  isAcceptable: boolean;

  @ApiProperty({ example: 1.0 })
  score: number;

  @ApiProperty({ example: 2 })
  passes: number;

  @ApiProperty({ example: 0 })
  fails: number;

  @ApiProperty({ example: 3 })
  attemptsCount: number;

  @ApiProperty({ type: () => ExamStudentLastAttemptDto, nullable: true })
  lastAttempt: ExamStudentLastAttemptDto | null;
}

export class ExamStudentGradesResponseDto {
  @ApiProperty({ example: 12 })
  userId: number;

  @ApiProperty({ example: 'Ana Silva' })
  name: string;

  @ApiProperty({ example: 'ana@example.com' })
  email: string;

  @ApiProperty({ example: 5 })
  totalAssignments: number;

  @ApiProperty({ example: 3 })
  attemptedAssignments: number;

  @ApiProperty({ example: 2 })
  approvedAssignments: number;

  @ApiProperty({ example: 1.5 })
  examGrade: number;

  @ApiProperty({ example: 5.0 })
  maxExamGrade: number;

  @ApiProperty({ type: () => [ExamStudentAssignmentDto] })
  assignments: ExamStudentAssignmentDto[];
}
