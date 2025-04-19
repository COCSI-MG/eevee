import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsEnum, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class TemplateParamDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  templateParamId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class AssignmentTemplateDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  templateId: number;

  @ApiProperty({ type: [TemplateParamDto] })
  @ValidateNested({ each: true })
  @Type(() => TemplateParamDto)
  params: TemplateParamDto[];
}
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

  @ApiProperty({ type: [AssignmentTemplateDto] })
  @ValidateNested({ each: true })
  @Type(() => AssignmentTemplateDto)
  templates: AssignmentTemplateDto[];
}
