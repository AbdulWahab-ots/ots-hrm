import { MigrationInterface, QueryRunner } from "typeorm";

// Idempotent (IF NOT EXISTS) so it is safe to re-run against a database whose schema
// already has this column — e.g. a fresh database built from the InitialSchema baseline,
// which already reflects the entity as it stands today.
export class AddIsSystemCompanyToCompany1750000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isSystemCompany" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Company" DROP COLUMN IF EXISTS "isSystemCompany"`
        );
    }
}
