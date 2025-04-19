import { Type } from "class-transformer";
import { ArrayNotEmpty, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsNotBlank } from "src/common/decorators/is-not-blank.decorator";

export class CreateTemplateDto {
  @IsNotBlank()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotBlank()
  description?: string;

  @ArrayNotEmpty()
  @IsNotBlank({ each: true })
  @Type(() => String)
  params: string[];

  @IsNotBlank()
  @IsString()
  templateContent: string;
} 
