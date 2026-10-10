import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/dto/pagination.query.dto';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class ListTemplatesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(WorkerType)
  workerType?: WorkerType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  classId?: number;
}
