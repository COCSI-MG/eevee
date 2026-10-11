import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { QuizChoiceDto } from './quiz-choice.dto';

export class QuizQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  id!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  prompt!: string;
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => QuizChoiceDto)
  choices!: QuizChoiceDto[];
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  correctChoiceId!: string;
  @IsString()
  @MaxLength(4000)
  explanation!: string;
}
