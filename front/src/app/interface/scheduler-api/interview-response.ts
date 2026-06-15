export type InterviewPreferenceOption =
  | 'sdk'
  | 'teraorm'
  | 'no_difference'
  | 'no_preference';

export interface InterviewResponsePayload {
  assignmentId: number;
  attemptId?: number;
  familiaritySql: number;
  familiarityJsTs: number;
  familiarityOrms: number;
  sdkClarity: number;
  sdkModifiability: number;
  sdkSqlErrorProneness: number;
  ormClarity: number;
  ormModifiability: number;
  ormIntent: number;
  ormMentalEffort: number;
  ormSafety: number;
  easierToUnderstand: InterviewPreferenceOption;
  easierToModify: InterviewPreferenceOption;
  futurePreference: InterviewPreferenceOption;
  teraormMainAdvantage?: string;
  teraormMainDifficulty?: string;
  additionalNotes?: string;
}

export interface InterviewResponse extends InterviewResponsePayload {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}
