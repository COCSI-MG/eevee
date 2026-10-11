import { IsString, MaxLength, MinLength } from 'class-validator';

export class QuizAnswerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  questionId!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  choiceId!: string;
}
