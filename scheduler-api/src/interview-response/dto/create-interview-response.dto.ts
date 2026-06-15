import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum InterviewPreferenceOption {
  SDK = 'sdk',
  TERAORM = 'teraorm',
  NO_DIFFERENCE = 'no_difference',
  NO_PREFERENCE = 'no_preference',
}

export class CreateInterviewResponseDto {
  @IsInt()
  @Min(1)
  assignmentId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  attemptId?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  familiaritySql: number;

  @IsInt()
  @Min(1)
  @Max(5)
  familiarityJsTs: number;

  @IsInt()
  @Min(1)
  @Max(5)
  familiarityOrms: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sdkClarity: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sdkModifiability: number;

  @IsInt()
  @Min(1)
  @Max(5)
  sdkSqlErrorProneness: number;

  @IsInt()
  @Min(1)
  @Max(5)
  ormClarity: number;

  @IsInt()
  @Min(1)
  @Max(5)
  ormModifiability: number;

  @IsInt()
  @Min(1)
  @Max(5)
  ormIntent: number;

  @IsInt()
  @Min(1)
  @Max(5)
  ormMentalEffort: number;

  @IsInt()
  @Min(1)
  @Max(5)
  ormSafety: number;

  @IsEnum(InterviewPreferenceOption)
  easierToUnderstand: InterviewPreferenceOption;

  @IsEnum(InterviewPreferenceOption)
  easierToModify: InterviewPreferenceOption;

  @IsEnum(InterviewPreferenceOption)
  futurePreference: InterviewPreferenceOption;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teraormMainAdvantage?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teraormMainDifficulty?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  additionalNotes?: string;
}
