import { ApiProperty } from '@nestjs/swagger';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { ExamResponseDto } from './exam-response.dto';

export class ExamAssignmentResponseDto {
  @ApiProperty({ example: 99 })
  id: number;

  @ApiProperty({ example: 1 })
  examId: number;

  @ApiProperty({ example: 2 })
  assignmentId: number;

  @ApiProperty({ type: () => ExamResponseDto })
  exam: ExamResponseDto;

  @ApiProperty({ type: () => Assignment })
  assignment: Assignment;
}
