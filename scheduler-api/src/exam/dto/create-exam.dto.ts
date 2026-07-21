import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsNotBlank } from 'src/common/decorators/is-not-blank.decorator';

export class CreateExamDto {
  @ApiProperty()
  @IsString()
  @IsNotBlank()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  classId?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
