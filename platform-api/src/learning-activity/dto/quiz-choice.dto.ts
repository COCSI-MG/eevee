import { IsString, MaxLength, MinLength } from 'class-validator';

export class QuizChoiceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  id!: string;
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}
