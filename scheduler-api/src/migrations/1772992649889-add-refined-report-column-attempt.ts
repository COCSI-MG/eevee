import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddRefinedReportColumnAttempt1772992649889 implements MigrationInterface {

public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("attempt", new TableColumn({
            name: "refinedReport",
            type: "text",
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("attempt", "refinedReport");
    }
}
