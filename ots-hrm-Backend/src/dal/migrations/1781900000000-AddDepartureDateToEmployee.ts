import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the nullable "departureDate" column to the Employee table.
 *
 * The entity gains the column in code, but where TypeORM `synchronize` is disabled
 * (staging/prod) the column must be added explicitly — otherwise reading/writing an
 * employee's departure date fails with "column does not exist". Nullable, so existing
 * rows are unaffected; populated when status becomes RESIGNED/TERMINATED/RETIRED and
 * cleared on reactivation (see Employee.onStatusChange).
 *
 * Idempotent (IF NOT EXISTS / IF EXISTS) so it is safe to re-run.
 */
export class AddDepartureDateToEmployee1781900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "departureDate" date`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Employee" DROP COLUMN IF EXISTS "departureDate"`
        );
    }
}
