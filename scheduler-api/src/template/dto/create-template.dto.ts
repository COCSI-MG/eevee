import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class CreateTemplateParamDefinitionDto {
  @IsNotBlank()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(TemplateParamType)
  type: TemplateParamType;
}

export class CreateTemplateDto {
  @IsNotBlank()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotBlank()
  description?: string;

  @IsArray()
  @IsNotBlank({ each: true })
  @Type(() => String)
  params: string[];

  @IsOptional()
  @IsArray()
  @Type(() => CreateTemplateParamDefinitionDto)
  typedParams?: CreateTemplateParamDefinitionDto[];

  @IsNotBlank()
  @IsString()
  templateContent: string;

  @IsNotEmpty()
  @IsEnum(WorkerType)
  workerType: WorkerType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  dependencies?: string[];
}
