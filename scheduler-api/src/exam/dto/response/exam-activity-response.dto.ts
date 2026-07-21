import { ApiProperty } from '@nestjs/swagger';
import { Assignment } from 'src/assignment/entities/assignment.entity';
import { ExamResponseDto } from './exam-response.dto';

export class ExamActivityResponseDto {
  @ApiProperty({ example: 99 })
  id: number;

  @ApiProperty({ example: 1 })
  examId: number;

  @ApiProperty({ example: 2 })
  activityId: number;

  @ApiProperty({ type: () => ExamResponseDto })
  exam: ExamResponseDto;

  @ApiProperty({ type: () => Assignment })
  activity: Assignment;
}
