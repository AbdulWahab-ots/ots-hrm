import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds a per-company counter ("lastEmployeeCodeNumber") backing the auto-suggested
 * Employee Code on the admin "Create Employee" form. Unlike deriving the next number
 * from the Employee table itself (row count, or MAX of existing codes), this counter
 * lives on Company and only ever moves forward — so a resigned/deleted employee's
 * code number is never reissued, and concurrent creations can be serialized with a
 * single atomic `UPDATE ... RETURNING` on this row (see CompanyRepository).
 *
 * Backfilled from the highest existing "EMP-NNN"-shaped employeeCode per company, so
 * companies with existing employees resume from the right place instead of restarting
 * at 0 and colliding with codes already in use.
 */
export class AddLastEmployeeCodeNumberToCompany1782300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "lastEmployeeCodeNumber" integer NOT NULL DEFAULT 0`
        );

        await queryRunner.query(`
            UPDATE "Company" c
            SET "lastEmployeeCodeNumber" = sub.max_num
            FROM (
                SELECT "companyId", MAX(CAST(substring("employeeCode" from 'EMP-(\\d+)$') AS integer)) AS max_num
                FROM "Employee"
                WHERE "employeeCode" ~ '^EMP-\\d+$'
                GROUP BY "companyId"
            ) sub
            WHERE c.id = sub."companyId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "Company" DROP COLUMN IF EXISTS "lastEmployeeCodeNumber"`
        );
    }
}
