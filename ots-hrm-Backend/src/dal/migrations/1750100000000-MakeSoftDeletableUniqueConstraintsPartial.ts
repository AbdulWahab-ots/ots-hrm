import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Department/Designation/Shift/Benefit/LeaveType/PublicHoliday deletes were switched
 * from hard-delete to soft-delete (setting "deleted" = true instead of removing the row).
 * Their existing UNIQUE constraints on (companyId, name/code[, departmentId]) don't know
 * about "deleted", so a soft-deleted row keeps blocking a brand-new row with the same
 * name/code (e.g. recreating a leave type called "Annual Leaves" after deleting the old one).
 *
 * Fix: drop those plain unique constraints and recreate them as PARTIAL unique indexes
 * scoped to `WHERE "deleted" = false`, so only active rows are checked for uniqueness.
 *
 * Constraint names are looked up dynamically (instead of hardcoded) since TypeORM's
 * generated UQ_* names are content hashes that can differ across environments.
 */

interface UniqueSpec {
    table: string;
    columns: string[];
}

const SPECS: UniqueSpec[] = [
    { table: 'Department', columns: ['companyId', 'code'] },
    { table: 'Department', columns: ['companyId', 'name'] },
    { table: 'Designation', columns: ['companyId', 'code'] },
    { table: 'Designation', columns: ['companyId', 'title'] },
    { table: 'Shift', columns: ['companyId', 'code', 'departmentId'] },
    { table: 'Shift', columns: ['companyId', 'name', 'departmentId'] },
    { table: 'Benefit', columns: ['companyId', 'code', 'departmentId'] },
    { table: 'Benefit', columns: ['companyId', 'name', 'departmentId'] },
    { table: 'LeaveType', columns: ['companyId', 'code'] },
    { table: 'LeaveType', columns: ['companyId', 'name'] },
    { table: 'PublicHoliday', columns: ['companyId', 'name', 'departmentId'] },
];

function partialIndexName(spec: UniqueSpec): string {
    return `IDX_${spec.table}_${spec.columns.join('_')}_active`;
}

export class MakeSoftDeletableUniqueConstraintsPartial1750100000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const spec of SPECS) {
            // Find and drop whatever the existing plain UNIQUE constraint is named.
            const existing: Array<{ conname: string }> = await queryRunner.query(`
                SELECT con.conname
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                WHERE con.contype = 'u'
                  AND rel.relname = $1
                  AND (
                    SELECT array_agg(attname ORDER BY ord)
                    FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
                    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
                  ) = $2::text[]
            `, [spec.table, spec.columns]);

            for (const row of existing) {
                await queryRunner.query(`ALTER TABLE "${spec.table}" DROP CONSTRAINT "${row.conname}"`);
            }

            const quotedColumns = spec.columns.map(c => `"${c}"`).join(', ');
            await queryRunner.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "${partialIndexName(spec)}"
                ON "${spec.table}" (${quotedColumns})
                WHERE "deleted" = false
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const spec of SPECS) {
            await queryRunner.query(`DROP INDEX IF EXISTS "${partialIndexName(spec)}"`);

            const quotedColumns = spec.columns.map(c => `"${c}"`).join(', ');
            await queryRunner.query(`
                ALTER TABLE "${spec.table}" ADD CONSTRAINT "UQ_${spec.table}_${spec.columns.join('_')}" UNIQUE (${quotedColumns})
            `);
        }
    }
}
