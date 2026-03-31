import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListAdminAttemptsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignmentId: number;

  @IsOptional()
  @IsString()
  userSearch?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
