import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from 'src/common/dto/pagination-meta-response.dto';
import { ExamStudentGradesResponseDto } from './exam-student-grades-response.dto';

export class PaginatedExamStudentsResponseDto {
  @ApiProperty({ type: [ExamStudentGradesResponseDto] })
  data: ExamStudentGradesResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
