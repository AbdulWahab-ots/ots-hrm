import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { randomUUID } from "crypto";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IInviteRequest, IInviteResponse, ITokenUser, InviteStatus, InviteExpiryDuration, InviteRole, IInviteCreateRequest } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { Company } from "./company";
import { DefaultRoles } from "../constants";

@Entity('Invite')
export class Invite extends CompanyEntityBase implements IToResponseBase<Invite, IInviteResponse> {

    @Column({ type: 'text', unique: true, nullable: false })
    email!: string;

    @Column({ type: 'text', nullable: false, unique: true })
    token!: string;

    @Column({ 
        type: 'enum', 
        enum: InviteStatus, 
        default: InviteStatus.PENDING 
    })
    status!: InviteStatus;

    @Column({ type: 'timestamp', nullable: false })
    expiresAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    acceptedAt?: Date;

    @Column({ type: 'enum', enum: InviteRole, nullable: false })
    role!: InviteRole;

    @BeforeInsert()
    beforeInsert() {
        // Only set expiry if not already set
        if (!this.expiresAt) {
            // Set default expiry to 7 days from now using enum
            this.expiresAt = new Date();
            this.expiresAt.setDate(this.expiresAt.getDate() + InviteExpiryDuration.ONE_WEEK);
        }
    }

    toResponse(): IInviteResponse {
        return {
            ...super.toCompanyResponseBase(this),
            email: this.email,
            token: this.token,
            status: this.status,
            expiresAt: this.expiresAt,
            acceptedAt: this.acceptedAt,
            role: this.role
        };
    }

    private generateInviteLink(): string {
        // You can configure this base URL from environment variables
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return `${baseUrl}/accept-invite?token=${this.token}`;
    }

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    isValid(): boolean {
        return this.status === InviteStatus.PENDING && !this.isExpired() && this.active && !this.deleted;
    }

    markAsAccepted(): void {
        this.status = InviteStatus.ACCEPTED;
        this.acceptedAt = new Date();
    }

    markAsExpired(): void {
        this.status = InviteStatus.EXPIRED;
    }

    markAsCancelled(): void {
        this.status = InviteStatus.CANCELLED;
    }

    extendExpiry(days: InviteExpiryDuration): void {
        this.expiresAt = new Date();
        this.expiresAt.setDate(this.expiresAt.getDate() + days);
    }


    getDaysUntilExpiry(): number {
        const now = new Date();
        const diffTime = this.expiresAt.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isExpiringSoon(warningDays: number = 2): boolean {
        return this.getDaysUntilExpiry() <= warningDays && this.getDaysUntilExpiry() > 0;
    }

    toEntity = (requestEntity: IInviteCreateRequest, id?: string, contextUser?: ITokenUser): Invite => {
        this.email = requestEntity.email;
        this.role = requestEntity.role || InviteRole.ADMIN; // Default to Admin if not specified

        if(contextUser) super.toCompanyEntity(contextUser, id);

        // Only a super admin may target another company via the request body; for everyone
        // else companyId stays the caller's own (set above), so a request can't inject it.
        if (requestEntity.companyId && contextUser?.role === DefaultRoles.SuperAdmin) {
            this.companyId = requestEntity.companyId;
            // Update the company reference as well
            this.company = new Company();
            this.company.id = requestEntity.companyId;
        }
        
        return this;
    }
}
