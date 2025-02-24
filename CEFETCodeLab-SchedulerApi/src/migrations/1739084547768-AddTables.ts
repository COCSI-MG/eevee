import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTables1739084547768 implements MigrationInterface {
    name = 'AddTables1739084547768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "applicant" (
                "id" SERIAL NOT NULL,
                "userId" integer,
                CONSTRAINT "PK_f4a6e907b8b17f293eb073fc5ea" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "applicant_attempt" (
                "id" SERIAL NOT NULL,
                "attempt" integer NOT NULL,
                "isAcceptable" boolean NOT NULL,
                "score" integer NOT NULL,
                "totalQuestions" integer NOT NULL,
                "report" character varying NOT NULL,
                "applicantId" integer,
                "assignmentId" integer,
                CONSTRAINT "PK_a9120c89edbd80b1495f2edcddc" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "assignment" (
                "id" SERIAL NOT NULL,
                "classId" integer,
                CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "class" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_0b9024d21bdfba8b1bd1c300eae" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "user_class" (
                "id" SERIAL NOT NULL,
                "userId" integer,
                "classId" integer,
                CONSTRAINT "PK_241fcc163fef37b7105a3038615" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "applicant"
            ADD CONSTRAINT "FK_546a819aa07c196d7aa0f9d17db" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "applicant_attempt"
            ADD CONSTRAINT "FK_e9f251727765ab6b8ecc337b878" FOREIGN KEY ("applicantId") REFERENCES "applicant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "applicant_attempt"
            ADD CONSTRAINT "FK_5113cd21b46ceda848974cd8196" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "assignment"
            ADD CONSTRAINT "FK_06502a00f4ff25d2f52f236ac5a" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_class"
            ADD CONSTRAINT "FK_d8b40aa051e54907e98c71f5b9f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_class"
            ADD CONSTRAINT "FK_4d8f981366a8720e8438bc1a398" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_class" DROP CONSTRAINT "FK_4d8f981366a8720e8438bc1a398"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_class" DROP CONSTRAINT "FK_d8b40aa051e54907e98c71f5b9f"
        `);
        await queryRunner.query(`
            ALTER TABLE "assignment" DROP CONSTRAINT "FK_06502a00f4ff25d2f52f236ac5a"
        `);
        await queryRunner.query(`
            ALTER TABLE "applicant_attempt" DROP CONSTRAINT "FK_5113cd21b46ceda848974cd8196"
        `);
        await queryRunner.query(`
            ALTER TABLE "applicant_attempt" DROP CONSTRAINT "FK_e9f251727765ab6b8ecc337b878"
        `);
        await queryRunner.query(`
            ALTER TABLE "applicant" DROP CONSTRAINT "FK_546a819aa07c196d7aa0f9d17db"
        `);
        await queryRunner.query(`
            DROP TABLE "user_class"
        `);
        await queryRunner.query(`
            DROP TABLE "class"
        `);
        await queryRunner.query(`
            DROP TABLE "assignment"
        `);
        await queryRunner.query(`
            DROP TABLE "applicant_attempt"
        `);
        await queryRunner.query(`
            DROP TABLE "applicant"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
    }

}
