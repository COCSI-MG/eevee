import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

export class TestTemplateParamDefDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(TemplateParamType)
  type?: TemplateParamType;
}

export class TestTemplateDto {
  @ApiProperty({ enum: WorkerType })
  @IsEnum(WorkerType)
  workerType: WorkerType;

  @ApiProperty({
    description:
      'Conteúdo do template (código de teste, equivale ao validation0.test.ts no pod).',
  })
  @IsString()
  templateContent: string;

  @ApiProperty({
    description:
      'Conteúdo do código de aplicação (equivale ao app.ts executado pelo pod).',
  })
  @IsString()
  applicationFileContent: string;

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: { type: 'string' },
    description: 'Arquivos adicionais do app que serão escritos no srcPath.',
  })
  @IsOptional()
  @IsObject()
  files?: Record<string, string>;

  @ApiProperty({
    required: false,
    type: Object,
    additionalProperties: { type: 'string' },
    description:
      'Valores dos templateParams, em formato string. São convertidos para o tipo declarado em `paramDefs`.',
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, string>;

  @ApiProperty({
    required: false,
    type: [TestTemplateParamDefDto],
    description:
      'Definições (nome + tipo) dos params. Quando ausente, todos os params são tratados como STRING.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestTemplateParamDefDto)
  paramDefs?: TestTemplateParamDefDto[];

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Dependências npm adicionais para o pod.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];
}
