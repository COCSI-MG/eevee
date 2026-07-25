import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAssignmentTemplateWeight1774700000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("assignment_template", new TableColumn({
            name: "weight",
            type: "decimal",
            precision: 5,
            scale: 2,
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("assignment_template", "weight");
    }
}
