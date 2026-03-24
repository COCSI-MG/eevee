import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';
import { NoSpecialCharacters } from 'src/common/decorators/no-special-characters.decorator';

export class CreateOrReplaceClassDto {
  @ApiProperty()
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotBlank()
  @NoSpecialCharacters()
  name: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @ApiPropertyOptional()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  students: number[];
}
