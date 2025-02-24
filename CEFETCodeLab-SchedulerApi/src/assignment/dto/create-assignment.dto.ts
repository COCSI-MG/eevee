import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  classId: number;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  validationScript: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  template: string;
  @ApiProperty()
  @IsNumber()
  maxAttempts: number;
  @ApiProperty()
  @IsEnum(WorkerType)
  workerType: WorkerType;
}
