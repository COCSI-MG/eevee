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

export class PracticeTaskDto {
  @IsString() @MinLength(1) @MaxLength(60) id: string;
  @IsString() @MinLength(1) @MaxLength(4000) prompt: string;
  @IsString() @MaxLength(20000) starter: string;
  @IsOptional() @IsString() @MaxLength(20000) checkSql?: string;
  @IsOptional() @IsString() @MaxLength(20000) expectedRows?: string;
  @IsOptional() @IsIn(['base', 'storage']) tool?: 'base' | 'storage';
  @IsOptional() @IsString() @MaxLength(100) expectedValue?: string;
  @IsOptional() @IsIn([2, 10, 16]) inputBase?: number;
}
export class PracticeConfigDto {
  @IsIn(['sql', 'architecture']) lab: 'sql' | 'architecture';
  @IsString() @MaxLength(50000) setupSql: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PracticeTaskDto)
  tasks: PracticeTaskDto[];
}
export class QuizChoiceDto {
  @IsString() @MinLength(1) @MaxLength(60) id: string;
  @IsString() @MinLength(1) @MaxLength(2000) text: string;
}
export class QuizQuestionDto {
  @IsString() @MinLength(1) @MaxLength(60) id: string;
  @IsString() @MinLength(1) @MaxLength(4000) prompt: string;
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => QuizChoiceDto)
  choices: QuizChoiceDto[];
  @IsString() @MinLength(1) @MaxLength(60) correctChoiceId: string;
  @IsString() @MaxLength(4000) explanation: string;
}
export class LearningActivityDto {
  @IsInt() @Min(1) classId: number;
  @IsIn(['practice', 'quiz']) kind: 'practice' | 'quiz';
  @IsString() @MinLength(1) @MaxLength(160) title: string;
  @IsString() @MaxLength(10000) description: string;
  @IsBoolean() published: boolean;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsInt() @Min(1) @Max(20) maxAttempts: number;
  @IsBoolean() feedbackReleased: boolean;
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
export class QuizAnswerDto {
  @IsString() @MinLength(1) @MaxLength(60) questionId: string;
  @IsString() @MinLength(1) @MaxLength(60) choiceId: string;
}
export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
