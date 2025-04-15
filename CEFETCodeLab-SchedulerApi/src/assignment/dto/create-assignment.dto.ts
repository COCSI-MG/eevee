import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  classId: number;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  @NoSpecialCharacters()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  validationScript: string;

  @ApiProperty()
  @IsString()
  @IsNotBlank()
  template: string;

  @ApiProperty()
  @IsNumber()
  maxAttempts: number;

  @ApiProperty()
  @IsEnum(WorkerType)
  workerType: WorkerType;

  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  templates: number[];
}
