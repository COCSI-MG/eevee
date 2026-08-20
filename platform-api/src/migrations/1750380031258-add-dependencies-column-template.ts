import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDependenciesColumnTemplate1750380031258 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("template", new TableColumn({
            name: "dependencies",
            type: "text",
            isArray: true,
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("template", "dependencies");
    }
}
