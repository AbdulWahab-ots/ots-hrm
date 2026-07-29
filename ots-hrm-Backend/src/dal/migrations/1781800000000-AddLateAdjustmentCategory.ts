import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds 'LATE' to the AdjustmentCategory Postgres enum that backs PayrollAdjustment.category.
 *
 * The TypeScript enum gains LATE in code, but where TypeORM `synchronize` is disabled
 * (staging/prod) the database enum must be altered explicitly — otherwise inserting a
 * payroll adjustment with category 'LATE' fails with "invalid input value for enum".
 *
 * Requires PostgreSQL 12+ (`ADD VALUE IF NOT EXISTS`; safe inside a transaction because the
 * new value is not USED in this same migration). The enum type name is resolved from the
 * column rather than hard-coded, so it can't drift from TypeORM's generated name.
 */
export class AddLateAdjustmentCategory1781800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const rows = await queryRunner.query(
            `SELECT udt_name FROM information_schema.columns
             WHERE table_name = 'PayrollAdjustment' AND column_name = 'category' LIMIT 1`
        );
        const enumType = rows?.[0]?.udt_name;
        if (!enumType) {
            throw new Error("Could not resolve the enum type for PayrollAdjustment.category");
        }
        await queryRunner.query(`ALTER TYPE "${enumType}" ADD VALUE IF NOT EXISTS 'LATE'`);
    }

    public async down(): Promise<void> {
        // PostgreSQL cannot drop a value from an enum without recreating the type. Leaving
        // 'LATE' in place is harmless, so this down migration is intentionally a no-op.
    }
}
