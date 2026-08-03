import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the nullable "zkDeviceUserId" column to the Employee table — the biometric
 * device's internal employee ID, used to link an employee to the external attendance
 * integration. Idempotent (IF NOT EXISTS / IF EXISTS) so it is safe to re-run.
 */
export class AddZkDeviceUserIdToEmployee1782200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "zkDeviceUserId" text`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Employee" DROP COLUMN IF EXISTS "zkDeviceUserId"`
        );
    }
}
