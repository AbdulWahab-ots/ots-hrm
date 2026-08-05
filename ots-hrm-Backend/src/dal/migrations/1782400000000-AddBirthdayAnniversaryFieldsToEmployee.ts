import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the fields backing the Birthday & Work Anniversary notification feature:
 * - "dateOfBirth": optional, admin-entered on the Employee (not the User) record.
 * - "lastBirthdayNotifiedYear" / "lastAnniversaryNotifiedYear": the business-timezone
 *   year the milestone cron last fired for this employee, per event type. Comparing
 *   against the current year (rather than a boolean/timestamp) is what makes the
 *   dedup naturally reset itself every year without a separate cleanup job.
 */
export class AddBirthdayAnniversaryFieldsToEmployee1782400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "dateOfBirth" date`);
        await queryRunner.query(`ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "lastBirthdayNotifiedYear" integer`);
        await queryRunner.query(`ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "lastAnniversaryNotifiedYear" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Employee" DROP COLUMN IF EXISTS "dateOfBirth"`);
        await queryRunner.query(`ALTER TABLE "Employee" DROP COLUMN IF EXISTS "lastBirthdayNotifiedYear"`);
        await queryRunner.query(`ALTER TABLE "Employee" DROP COLUMN IF EXISTS "lastAnniversaryNotifiedYear"`);
    }
}
