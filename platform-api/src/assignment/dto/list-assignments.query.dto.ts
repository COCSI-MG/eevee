import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.query.dto';

export class ListAssignmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  classId?: number;
}
