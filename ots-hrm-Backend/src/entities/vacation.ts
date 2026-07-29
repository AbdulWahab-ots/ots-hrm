import { Column, Entity, JoinColumn, ManyToOne, Index, Unique } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { User } from "./user";
import { LeaveType } from "./leave-type";
import { ITokenUser, VacationStatus, VacationProgressStatus, RequestType, IVacationRequest, IVacationResponse } from "../models";



// ========================= VACATION ENTITY =========================
@Entity('Vacation')
@Index(['requestedBy', 'fromDate', 'toDate', 'requestType'])
@Index(['status', 'companyId', 'requestType'])
@Index(['typeId', 'status', 'requestType'])
@Index(['requestedBy', 'companyId', 'status']) // Added for better querying performance
export class Vacation extends CompanyEntityBase implements IToResponseBase<Vacation, IVacationResponse> {

    @Column({ type: 'uuid', nullable: false })
    requestedBy!: string;

    @Column({ type: 'date', nullable: false })
    fromDate!: Date;

    @Column({ type: 'date', nullable: false })
    toDate!: Date;

    @Column({ type: 'int', nullable: false, default: 1 })
    totalDays!: number;

    @Column({ type: 'text', nullable: false })
    reason!: string;

    @Column({ type: 'uuid', nullable: true }) // Made nullable for remote work requests
    typeId?: string;

    @Column({ type: 'uuid', nullable: true })
    actionBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    actionAt?: Date;

    @Column({ 
        type: 'enum', 
        enum: VacationStatus,
        default: VacationStatus.PENDING,
        nullable: false 
    })
    status!: VacationStatus;

    @Column({ 
        type: 'enum', 
        enum: VacationProgressStatus,
        default: null, // Default to null for optional field
        nullable: true
    })
    progressStatus?: VacationProgressStatus;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ 
        type: 'enum', 
        enum: RequestType,
        default: RequestType.LEAVE,
        nullable: false 
    })
    requestType!: RequestType;

    // Relations
    @ManyToOne(() => User, { nullable: false, eager: false })
    @JoinColumn({ name: 'requestedBy', referencedColumnName: 'id' })
    requestedByUser!: User;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'actionBy', referencedColumnName: 'id' })
    actionByUser?: User;

    @ManyToOne(() => LeaveType, { nullable: true, eager: false }) // Made nullable for remote work requests
    @JoinColumn({ name: 'typeId', referencedColumnName: 'id' })
    leaveType?: LeaveType;

    // ========================= RESPONSE MAPPING =========================
    toResponse(entity?: Vacation): IVacationResponse {
        if (!entity) entity = this;
        
        return {
            ...super.toCompanyResponseBase(entity),
            requestedBy: entity.requestedBy,
            fromDate: entity.fromDate,
            toDate: entity.toDate,
            totalDays: entity.totalDays,
            reason: entity.reason,
            typeId: entity.typeId,
            actionBy: entity.actionBy,
            actionAt: entity.actionAt,
            status: entity.status,
            progressStatus: entity.progressStatus,
            rejectionReason: entity.rejectionReason,
            requestType: entity.requestType,
            requestedByUser: entity.requestedByUser ? entity.requestedByUser.toResponse() : undefined,
            actionByUser: entity.actionByUser ? entity.actionByUser.toResponse() : undefined,
            leaveType: entity.leaveType ? entity.leaveType.toResponse() : undefined,
        };
    }

    // ========================= ENTITY MAPPING =========================
    toEntity(request: IVacationRequest, id?: string, contextUser?: ITokenUser): Vacation {
        this.requestedBy = request.requestedBy;
        this.fromDate = new Date(request.fromDate);
        this.toDate = new Date(request.toDate);
        this.reason = request.reason;
        this.typeId = request.typeId; // Can be undefined for remote work requests
        this.actionBy = request.actionBy;
        this.actionAt = request.actionAt;
        this.status = request.status || VacationStatus.PENDING;
        this.progressStatus = request.progressStatus;
        this.rejectionReason = request.rejectionReason;
        this.requestType = request.requestType || RequestType.LEAVE;
        
        // Calculate total days automatically
        this.totalDays = this.calculateTotalDays(false);
        
        // Debug logging to ensure totalDays is calculated
        console.log('Entity totalDays calculation:', {
            fromDate: this.fromDate,
            toDate: this.toDate,
            totalDays: this.totalDays
        });

        if (contextUser) {
            super.toCompanyEntity(contextUser, id);
        }

        return this;
    }

    // ========================= BUSINESS LOGIC =========================
    calculateTotalDays(includeWeekends: boolean = false): number {
        const startDate = new Date(this.fromDate);
        const endDate = new Date(this.toDate);
        let totalDays = 0;

        // Iterate through each day in the range
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            if (includeWeekends) {
                totalDays++;
            } else {
                // Skip weekends (Saturday = 6, Sunday = 0)
                const dayOfWeek = date.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    totalDays++;
                }
            }
        }

        return totalDays;
    }

    // Calculate weekdays only (Monday to Friday)
    calculateWeekdays(): number {
        return this.calculateTotalDays(false);
    }

    // Calculate total calendar days (including weekends)
    calculateCalendarDays(): number {
        return this.calculateTotalDays(true);
    }

    // Check if the vacation period is a single day
    isSingleDay(): boolean {
        return this.fromDate.getTime() === this.toDate.getTime();
    }

    // Check if the vacation period spans across weekends
    includesWeekends(): boolean {
        const startDate = new Date(this.fromDate);
        const endDate = new Date(this.toDate);

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return true;
            }
        }
        return false;
    }

    // Get duration in days between fromDate and toDate
    getDurationInDays(): number {
        const startDate = new Date(this.fromDate);
        const endDate = new Date(this.toDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    }

    // Check if vacation is pending approval
    isPending(): boolean {
        return this.status === VacationStatus.PENDING;
    }

    // Check if vacation is approved
    isApproved(): boolean {
        return this.status === VacationStatus.APPROVED;
    }

    // Check if vacation is rejected
    isRejected(): boolean {
        return this.status === VacationStatus.REJECTED;
    }

    // Check if vacation is cancelled
    isCancelled(): boolean {
        return this.status === VacationStatus.CANCELLED;
    }

    // Check if vacation is a leave request
    isLeaveRequest(): boolean {
        return this.requestType === RequestType.LEAVE;
    }

    // Check if vacation is a remote work request
    isRemoteWorkRequest(): boolean {
        return this.requestType === RequestType.REMOTE_WORK;
    }

    // Get readable status
    getReadableStatus(): string {
        switch (this.status) {
            case VacationStatus.PENDING:
                return 'Pending Approval';
            case VacationStatus.APPROVED:
                return 'Approved';
            case VacationStatus.REJECTED:
                return 'Rejected';
            case VacationStatus.CANCELLED:
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    }

    // Get readable request type
    getReadableRequestType(): string {
        switch (this.requestType) {
            case RequestType.LEAVE:
                return 'Leave Request';
            case RequestType.REMOTE_WORK:
                return 'Remote Work Request';
            default:
                return 'Unknown Request Type';
        }
    }

    // Validate vacation dates
    validateDates(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (this.fromDate > this.toDate) {
            errors.push('From date must be before or equal to to date');
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (this.fromDate < today) {
            errors.push('From date cannot be in the past');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Check if vacation can be cancelled
    canBeCancelled(): boolean {
        return this.status === VacationStatus.PENDING || this.status === VacationStatus.APPROVED;
    }

}