import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListAssignmentsByClassQueryDto {
  @ApiPropertyOptional({
    description:
      'If provided, filters assignments by whether they are linked to an exam. ' +
      '`true` returns only assignments linked to at least one exam; ' +
      '`false` returns only assignments not linked to any exam.',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true' || v === '1') return true;
      if (v === 'false' || v === '0') return false;
    }
    return value;
  })
  linkedToExam?: boolean;
}
