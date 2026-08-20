import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.query.dto';

export type ExamSortOrder = 'asc' | 'desc';

export class ListExamsByClassQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description:
      'Sort direction by dueDate. Defaults to "asc" (soonest first).',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  sort?: ExamSortOrder;
}
