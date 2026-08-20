import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1749519712474 implements MigrationInterface {
    name = 'InitialMigration1749519712474'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "template" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying, "filePath" character varying NOT NULL, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_template" ("id" SERIAL NOT NULL, "assignmentId" integer NOT NULL, "templateId" integer NOT NULL, CONSTRAINT "PK_3650f3011bf5c10763c7be3718c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "class" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_0b9024d21bdfba8b1bd1c300eae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_class" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "classId" integer NOT NULL, CONSTRAINT "PK_241fcc163fef37b7105a3038615" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "isAdmin" boolean NOT NULL, "passwordHash" character varying NOT NULL, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attempt" ("id" SERIAL NOT NULL, "attempt" integer NOT NULL, "userId" integer NOT NULL, "assignmentId" integer NOT NULL, "isAcceptable" boolean NOT NULL, "score" double precision NOT NULL, "passes" integer NOT NULL, "fails" integer NOT NULL, "report" character varying NOT NULL, CONSTRAINT "PK_5f822b29b3128d1c65d3d6c193d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."assignment_workertype_enum" AS ENUM('node_default', 'node_nestjs')`);
        await queryRunner.query(`CREATE TABLE "assignment" ("id" SERIAL NOT NULL, "classId" integer NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "maxAttempts" integer NOT NULL, "workerType" "public"."assignment_workertype_enum" NOT NULL, CONSTRAINT "PK_43c2f5a3859f54cedafb270f37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assignment_param" ("id" SERIAL NOT NULL, "value" character varying NOT NULL, "assignmentId" integer NOT NULL, "templateParamsId" integer NOT NULL, CONSTRAINT "PK_d8497a73426146ed48e5344b124" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "template_param" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "templateId" integer NOT NULL, CONSTRAINT "PK_5275cd25ba0787547028a513c0a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "assignment_template" ADD CONSTRAINT "FK_edab2d7041eeb07c0e3a977251c" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_template" ADD CONSTRAINT "FK_5e5dbd60065f79e67eaef21bef1" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_class" ADD CONSTRAINT "FK_d8b40aa051e54907e98c71f5b9f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_class" ADD CONSTRAINT "FK_4d8f981366a8720e8438bc1a398" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt" ADD CONSTRAINT "FK_dd8844876037b478f5bb859512e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt" ADD CONSTRAINT "FK_c41ef7ef9d4afd2815645860d60" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment" ADD CONSTRAINT "FK_06502a00f4ff25d2f52f236ac5a" FOREIGN KEY ("classId") REFERENCES "class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_param" ADD CONSTRAINT "FK_e8b7f915dbef851a315dbbfcb2e" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assignment_param" ADD CONSTRAINT "FK_7d04213f215b0b001fab9db56c7" FOREIGN KEY ("templateParamsId") REFERENCES "template_param"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_param" ADD CONSTRAINT "FK_95f795e0701c28746c9679fe55a" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_param" DROP CONSTRAINT "FK_95f795e0701c28746c9679fe55a"`);
        await queryRunner.query(`ALTER TABLE "assignment_param" DROP CONSTRAINT "FK_7d04213f215b0b001fab9db56c7"`);
        await queryRunner.query(`ALTER TABLE "assignment_param" DROP CONSTRAINT "FK_e8b7f915dbef851a315dbbfcb2e"`);
        await queryRunner.query(`ALTER TABLE "assignment" DROP CONSTRAINT "FK_06502a00f4ff25d2f52f236ac5a"`);
        await queryRunner.query(`ALTER TABLE "attempt" DROP CONSTRAINT "FK_c41ef7ef9d4afd2815645860d60"`);
        await queryRunner.query(`ALTER TABLE "attempt" DROP CONSTRAINT "FK_dd8844876037b478f5bb859512e"`);
        await queryRunner.query(`ALTER TABLE "user_class" DROP CONSTRAINT "FK_4d8f981366a8720e8438bc1a398"`);
        await queryRunner.query(`ALTER TABLE "user_class" DROP CONSTRAINT "FK_d8b40aa051e54907e98c71f5b9f"`);
        await queryRunner.query(`ALTER TABLE "assignment_template" DROP CONSTRAINT "FK_5e5dbd60065f79e67eaef21bef1"`);
        await queryRunner.query(`ALTER TABLE "assignment_template" DROP CONSTRAINT "FK_edab2d7041eeb07c0e3a977251c"`);
        await queryRunner.query(`DROP TABLE "template_param"`);
        await queryRunner.query(`DROP TABLE "assignment_param"`);
        await queryRunner.query(`DROP TABLE "assignment"`);
        await queryRunner.query(`DROP TYPE "public"."assignment_workertype_enum"`);
        await queryRunner.query(`DROP TABLE "attempt"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "user_class"`);
        await queryRunner.query(`DROP TABLE "class"`);
        await queryRunner.query(`DROP TABLE "assignment_template"`);
        await queryRunner.query(`DROP TABLE "template"`);
    }

}
