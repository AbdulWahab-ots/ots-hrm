import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { ITokenUser, IUserShiftRequest, IUserShiftResponse } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { ICompanyResponseBase } from "../models/inerfaces/response/response-base";
import { User } from "./user";
import { Shift } from "./shift";
import { Employee } from "./employee";

@Entity('UserShift')
// @Index('idx_user_shift_assignments', ['companyId', 'userId', 'effectiveFrom', 'effectiveTo'])
// @Index('idx_employee_shift_assignments', ['companyId', 'effectiveFrom', 'effectiveTo'])
// @Index('idx_shift_assignments', ['companyId', 'shiftId'])
// @Index('idx_active_user_shifts', ['companyId', 'userId', 'effectiveFrom'])
export class UserShift extends CompanyEntityBase implements IToResponseBase<UserShift, IUserShiftResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'uuid', nullable: false })
    shiftId!: string;

    @Column({ type: 'date', nullable: false })
    effectiveFrom!: Date;

    @Column({ type: 'date', nullable: true })
    effectiveTo?: Date; // NULL means ongoing

    @ManyToOne(() => User, { nullable: false, eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => Shift, { nullable: false, eager: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shiftId', referencedColumnName: 'id' })
    shift!: Shift;
    
    toResponse(entity?: UserShift): IUserShiftResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            userId: entity.userId,
            shiftId: entity.shiftId,
            effectiveFrom: entity.effectiveFrom,
            effectiveTo: entity.effectiveTo,
            user: entity.user ? entity.user.toResponse(entity.user) : undefined,
            shift: entity.shift ? entity.shift.toResponse(entity.shift) : undefined
        }
    }

    toEntity = (entityRequest: IUserShiftRequest, id?: string, contextUser?: ITokenUser): UserShift => {
        this.userId = entityRequest.userId;
        this.shiftId = entityRequest.shiftId;
        this.effectiveFrom = entityRequest.effectiveFrom;
        this.effectiveTo = entityRequest.effectiveTo;

        // Set user and shift objects
        let user = new User();
        user.id = entityRequest.userId;
        this.user = user;

        let shift = new Shift();
        shift.id = entityRequest.shiftId;
        this.shift = shift;

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper method to check if shift assignment is currently active
    isActive(date: Date = new Date()): boolean {
        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const fromDate = new Date(this.effectiveFrom.getFullYear(), this.effectiveFrom.getMonth(), this.effectiveFrom.getDate());
        
        if (checkDate < fromDate) return false;
        
        if (!this.effectiveTo) return true; // Ongoing assignment
        
        const toDate = new Date(this.effectiveTo.getFullYear(), this.effectiveTo.getMonth(), this.effectiveTo.getDate());
        return checkDate <= toDate;
    }

    // Helper method to get duration of shift assignment in days
    getDurationInDays(): number | null {
        if (!this.effectiveTo) return null; // Ongoing assignment
        
        const fromTime = this.effectiveFrom.getTime();
        const toTime = this.effectiveTo.getTime();
        return Math.ceil((toTime - fromTime) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Static method to validate date range
    static isValidDateRange(effectiveFrom: Date, effectiveTo?: Date): boolean {
        if (!effectiveTo) return true; // Ongoing assignment is valid
        return effectiveFrom <= effectiveTo;
    }

    // Static method to check for overlapping assignments
    static hasOverlap(assignment1: { effectiveFrom: Date; effectiveTo?: Date }, 
                     assignment2: { effectiveFrom: Date; effectiveTo?: Date }): boolean {
        const start1 = assignment1.effectiveFrom;
        const end1 = assignment1.effectiveTo || new Date('9999-12-31');
        const start2 = assignment2.effectiveFrom;
        const end2 = assignment2.effectiveTo || new Date('9999-12-31');
        
        return start1 <= end2 && start2 <= end1;
    }
}