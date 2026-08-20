import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from 'src/common/dto/pagination-meta-response.dto';
import { ExamResponseDto } from './exam-response.dto';

export class PaginatedExamsResponseDto {
  @ApiProperty({ type: [ExamResponseDto] })
  data: ExamResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
