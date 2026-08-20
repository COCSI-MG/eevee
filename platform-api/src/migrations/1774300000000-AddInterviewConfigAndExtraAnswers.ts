import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterviewConfigAndExtraAnswers1774300000000
  implements MigrationInterface
{
  name = 'AddInterviewConfigAndExtraAnswers1774300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assignment" ADD COLUMN IF NOT EXISTS "interviewConfig" jsonb`,
    );

    await queryRunner.query(
      `ALTER TABLE "interview_response" ADD COLUMN IF NOT EXISTS "extraAnswers" jsonb`,
    );

    const nullableColumns = [
      'familiaritySql',
      'familiarityJsTs',
      'familiarityOrms',
      'sdkClarity',
      'sdkModifiability',
      'sdkSqlErrorProneness',
      'ormClarity',
      'ormModifiability',
      'ormIntent',
      'ormMentalEffort',
      'ormSafety',
      'easierToUnderstand',
      'easierToModify',
      'futurePreference',
    ];

    for (const column of nullableColumns) {
      await queryRunner.query(
        `ALTER TABLE "interview_response" ALTER COLUMN "${column}" DROP NOT NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const nullableColumns = [
      'familiaritySql',
      'familiarityJsTs',
      'familiarityOrms',
      'sdkClarity',
      'sdkModifiability',
      'sdkSqlErrorProneness',
      'ormClarity',
      'ormModifiability',
      'ormIntent',
      'ormMentalEffort',
      'ormSafety',
      'easierToUnderstand',
      'easierToModify',
      'futurePreference',
    ];

    for (const column of nullableColumns) {
      await queryRunner.query(
        `ALTER TABLE "interview_response" ALTER COLUMN "${column}" SET NOT NULL`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "interview_response" DROP COLUMN IF EXISTS "extraAnswers"`,
    );

    await queryRunner.query(
      `ALTER TABLE "assignment" DROP COLUMN IF EXISTS "interviewConfig"`,
    );
  }
}
