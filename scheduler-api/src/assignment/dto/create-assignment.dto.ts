import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';
import { WorkerDefinitionDto } from 'src/worker/dto/worker-definition.dto';
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
  @IsNumber()
  maxAttempts: number;

  @ApiProperty()
  @IsEnum(WorkerType)
  workerType: WorkerType;

  @ApiProperty()
  @IsString()
  @IsOptional()
  validationScript: string;

  @ApiProperty({
    description:
      'Boilerplate code provided by the teacher (stored as a server-side file). Prefer this field; validationScript is kept for backward compatibility.',
    required: false,
  })
  @IsOptional()
  @IsString()
  boilerplate?: string;

  @ApiProperty({ type: [AssignmentTemplateDto] })
  @ValidateNested({ each: true })
  @Type(() => AssignmentTemplateDto)
  templates: AssignmentTemplateDto[];
}
