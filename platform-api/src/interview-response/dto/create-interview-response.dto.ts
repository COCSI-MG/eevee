import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
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

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  familiaritySql?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  familiarityJsTs?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  familiarityOrms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  sdkClarity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  sdkModifiability?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  sdkSqlErrorProneness?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ormClarity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ormModifiability?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ormIntent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ormMentalEffort?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ormSafety?: number;

  @IsOptional()
  @IsEnum(InterviewPreferenceOption)
  easierToUnderstand?: InterviewPreferenceOption;

  @IsOptional()
  @IsEnum(InterviewPreferenceOption)
  easierToModify?: InterviewPreferenceOption;

  @IsOptional()
  @IsEnum(InterviewPreferenceOption)
  futurePreference?: InterviewPreferenceOption;

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

  @IsOptional()
  @IsObject()
  extraAnswers?: Record<string, string | number>;
}
