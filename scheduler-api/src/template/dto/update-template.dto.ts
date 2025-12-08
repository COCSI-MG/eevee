import { PartialType } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
    @IsOptional()
    @IsNotBlank()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    @IsNotBlank()
    description?: string;

    @IsOptional()
    @ArrayNotEmpty()
    @IsNotBlank({ each: true })
    @Type(() => String)
    params: string[];

    @IsOptional()
    @IsNotBlank()
    @IsString()
    templateContent: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Type(() => String)
    dependencies?: string[];
}
