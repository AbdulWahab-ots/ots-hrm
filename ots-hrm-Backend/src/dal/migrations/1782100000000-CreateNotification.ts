import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates the Notification table (in-app notifications, one row per recipient).
 *
 * Columns mirror the Notification entity: recipientUserId/title/message/type/isRead plus
 * the EntityBase/CompanyEntityBase audit + tenancy fields. In dev `synchronize` creates
 * this automatically; staging/prod (synchronize off) need this migration. Idempotent.
 */
export class CreateNotification1782100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // The enum type backing Notification.type. Create it only if absent (TypeORM names
        // it "Notification_type_enum" by convention).
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Notification_type_enum') THEN
                    CREATE TYPE "Notification_type_enum" AS ENUM ('LEAVE_STATUS', 'PAYSLIP', 'ANNOUNCEMENT', 'GENERAL');
                END IF;
            END$$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "Notification" (
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
                "recipientUserId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "type" "Notification_type_enum" NOT NULL DEFAULT 'GENERAL',
                "isRead" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_Notification_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_Notification_company" FOREIGN KEY ("companyId")
                    REFERENCES "Company"("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_Notification_company_recipient_isRead" ON "Notification" ("companyId", "recipientUserId", "isRead")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "Notification"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "Notification_type_enum"`);
    }
}
