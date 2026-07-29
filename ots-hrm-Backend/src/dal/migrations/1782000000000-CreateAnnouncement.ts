import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates the Announcement table (company-scoped admin announcements).
 *
 * Columns mirror the Announcement entity: the message (title, description) plus the
 * EntityBase/CompanyEntityBase audit + tenancy fields. In dev `synchronize` creates this
 * automatically; staging/prod (synchronize off) need this migration. IF NOT EXISTS makes
 * it safe to run in either environment.
 */
export class CreateAnnouncement1782000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "Announcement" (
                "id" uuid NOT NULL,
                "createdAt" timestamp NOT NULL,
                "active" boolean NOT NULL DEFAULT true,
                "createdBy" text NOT NULL,
                "createdById" uuid NOT NULL,
                "modifiedAt" timestamp,
                "modifiedBy" text,
                "modifiedById" uuid,
                "deleted" boolean NOT NULL DEFAULT false,
                "companyId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text NOT NULL,
                CONSTRAINT "PK_Announcement_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_Announcement_company" FOREIGN KEY ("companyId")
                    REFERENCES "Company"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_Announcement_companyId_deleted" ON "Announcement" ("companyId", "deleted")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "Announcement"`);
    }
}
