import { Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { EntityBase } from "./base-entities/entity-base";
import { User } from "./user";
import { ITokenUser, VerificationMethods } from "../models";
import { VerificationTypes } from "../models/enums";

@Entity('Verification')
export class Verification extends EntityBase {
    
    @Column({ type: 'varchar', length: 255 })
    @Index()
    target!: string; // email or phone number

    @Column({ type: 'varchar', length: 10 })
    code?: string; // OTP or verification code

    @Column({ type: 'varchar', length: 255, default: null })
    url?: string; // URL for verification

    @Column({ type: 'enum', enum: VerificationMethods, default: null })
    type!: VerificationMethods

    @Column({ type: 'enum', enum: VerificationTypes, default: null })
    whichPurpose!: VerificationTypes; // accountVerify, forgotPassword, etc.

    @Column({ type: 'boolean', default: false })
    verified!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt!: Date;

    @Column({ nullable: true })
    userId?: string;

    @ManyToOne(() => User, (user) => user, {nullable: true, eager: true})
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User

    isExpired(): boolean {
        return this.expiresAt ? new Date() > this.expiresAt : false;
    }

    toResponse(): any {
        return {
            target: this.target,
            code: this.code,
            type: this.type,
            whichPurpose: this.whichPurpose,
            verified: this.verified,
            expiresAt: this.expiresAt,
            userId: this.userId,
        };
    }

    toEntity(entityRequest: any, id?: string, contextUser?: ITokenUser): Verification {
        this.target = entityRequest.target;
        this.code = entityRequest.code;
        this.type = entityRequest.type;
        this.whichPurpose = entityRequest.whichPurpose;
        this.verified = entityRequest.verified;
        this.expiresAt = entityRequest.expiresAt;
        this.userId = entityRequest.userId;

        if (contextUser) {
            super.toBaseEntiy(contextUser, id);
        }

        return this;
    }

}
