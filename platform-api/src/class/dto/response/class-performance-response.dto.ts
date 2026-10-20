import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaResponseDto } from 'src/common/dto/pagination-meta-response.dto';
import { ClassActivityOptionDto } from './class-activity-option.dto';
import { ClassStudentPerformanceDto } from './class-student-performance.dto';

export class ClassPerformanceResponseDto {
  @ApiProperty({
    type: [ClassActivityOptionDto]
  })
  activities: ClassActivityOptionDto[];

  @ApiProperty({
    type: [ClassStudentPerformanceDto]
  })
  data: ClassStudentPerformanceDto[];

  @ApiProperty({
    type: PaginationMetaResponseDto
  })
  meta: PaginationMetaResponseDto;
}
