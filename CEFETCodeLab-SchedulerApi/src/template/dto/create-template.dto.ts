import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsNotBlank } from "src/common/decorators/is-not-blank.decorator";

export class CreateTemplateDto {
  @IsNotBlank()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  @IsNotBlank()
  description?: string;

  @IsNotBlank()
  @IsString()
  filePath: string;
}
