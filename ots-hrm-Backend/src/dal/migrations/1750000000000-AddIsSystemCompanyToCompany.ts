import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsSystemCompanyToCompany1750000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("Company", new TableColumn({
            name: "isSystemCompany",
            type: "boolean",
            isNullable: false,
            default: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("Company", "isSystemCompany");
    }
}
