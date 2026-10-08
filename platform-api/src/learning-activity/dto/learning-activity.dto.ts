import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LearningActivityKind } from '../enums/learning-activity-kind.enum';
import { PracticeConfigDto } from './practice-config.dto';
import { QuizQuestionDto } from './quiz-question.dto';

export class LearningActivityDto {
  @IsInt()
  @Min(1)
  classId!: number;
  @IsIn(Object.values(LearningActivityKind))
  kind!: LearningActivityKind;
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;
  @IsString()
  @MaxLength(10000)
  description!: string;
  @IsBoolean()
  published!: boolean;
  @IsOptional()
  @IsDateString()
  startDate?: string | null;
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
  @IsInt()
  @Min(1)
  @Max(20)
  maxAttempts!: number;
  @IsBoolean()
  feedbackReleased!: boolean;
  @IsOptional()
  @ValidateNested()
  @Type(() => PracticeConfigDto)
  practice?: PracticeConfigDto | null;
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions?: QuizQuestionDto[] | null;
}
