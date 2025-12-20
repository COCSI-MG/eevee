import { MaxFileSizeValidator } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateWorkerDto } from 'src/worker/dto/create-worker.dto';
import { WorkerFilesNodeDto } from 'src/worker/dto/worker-definition.dto';
import {
  MaxDepthConstraint,
  MaxFilesConstraint,
} from 'src/worker/validators/worker-files-node.validators';

export class CreateSchedulingDto extends CreateWorkerDto {
  @ApiProperty()
  @IsNumber()
  @Min(1, { message: 'assignmentId must be greater than zero' })
  assignmentId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  applicationFileContent: string;

  @ApiProperty({ required: false, type: WorkerFilesNodeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerFilesNodeDto)
  @Validate(MaxDepthConstraint, [5])
  @Validate(MaxFilesConstraint, [50])
  files: WorkerFilesNodeDto;
}
