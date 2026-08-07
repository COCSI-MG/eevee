import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerKeyQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class CreateAnswerKeyDto {
  @ApiProperty({ type: [AnswerKeyQuestionDto] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AnswerKeyQuestionDto)
  questions: AnswerKeyQuestionDto[];
}
