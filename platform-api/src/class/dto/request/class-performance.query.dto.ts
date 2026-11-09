import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  Min
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.query.dto';


function parseActivityIds(value: string): number[] | string {
  const ids = value.split(',');

  const regexOnlyNumber = /^\d+$/

  return ids.every((id) => regexOnlyNumber.test(id)) ? ids.map(Number) : value;
}
export class ClassPerformanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, example: '12,15' })
  @Transform(({ value }) => typeof value === 'string' ? parseActivityIds(value) : value)
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  activityIds?: number[];
}
