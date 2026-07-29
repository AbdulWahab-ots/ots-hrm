import { Column, Entity, JoinColumn, ManyToOne, Index } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { User } from "./user";
import { Attendance } from "./attendance";
import { IRequestRequest, IRequestResponse, ITokenUser } from "../models";
import { AttendanceRequestStatus, AttendanceRequestType } from "../models/enums";

@Entity('Request')
@Index(['userId', 'date', 'type'], { unique: true })
export class Request extends CompanyEntityBase implements IToResponseBase<Request, IRequestResponse> {
    
    @Column({ type: 'varchar', length: 20, nullable: false})
    code!: string;

    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'uuid', nullable: false })
    attendanceId!: string;

    @Column({ 
        type: 'enum', 
        enum: AttendanceRequestType,
        nullable: false 
    })
    type!: AttendanceRequestType;

    @Column({ type: 'date', nullable: false })
    date!: Date;

    // Store only time in 24-hour format (HH:MM:SS)
    @Column({ type: 'time', nullable: false })
    time!: string;

    @Column({ type: 'text', nullable: false })
    reason!: string;

    @Column({ 
        type: 'enum', 
        enum: AttendanceRequestStatus,
        default: AttendanceRequestStatus.PENDING,
        nullable: false 
    })
    status!: AttendanceRequestStatus;

    @Column({ type: 'uuid', nullable: true })
    reviewedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt?: Date;

    @Column({ type: 'text', nullable: true })
    reviewNotes?: string;

    // Relations
    @ManyToOne(() => User, { nullable: false, eager: false })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'reviewedBy', referencedColumnName: 'id' })
    reviewedByUser?: User;

    // Add relation to Attendance
    @ManyToOne(() => Attendance, { nullable: false, eager: false })
    @JoinColumn({ name: 'attendanceId', referencedColumnName: 'id' })
    attendance!: Attendance;

    toResponse(entity?: Request): IRequestResponse {
        if (!entity) entity = this;
        
        return {
            ...super.toCompanyResponseBase(entity),
            code: entity.code,
            userId: entity.userId,
            user: entity.user ? entity.user.toResponse() : undefined,
            attendanceId: entity.attendanceId,
            attendance: entity.attendance ? entity.attendance.toResponse() : undefined,
            type: entity.type,
            date: entity.date,
            time: entity.time,
            reason: entity.reason,
            status: entity.status,
            reviewedBy: entity.reviewedBy,
            reviewedByUser: entity.reviewedByUser ? entity.reviewedByUser.toResponse() : undefined,
            reviewedAt: entity.reviewedAt,
            reviewNotes: entity.reviewNotes
        };
    }

    toEntity(requestEntity: IRequestRequest, id?: string, contextUser?: ITokenUser): Request {
        if (contextUser) {
            super.toCompanyEntity(contextUser, id);
        }
        
        // Code will be set by the service layer if not provided
        if (requestEntity.code) {
            this.code = requestEntity.code;
        }
        
        this.userId = requestEntity.userId;
        
        // AttendanceId will be set by the service layer if not provided
        if (requestEntity.attendanceId) {
            this.attendanceId = requestEntity.attendanceId;
        }
        
        this.type = requestEntity.type;
        this.date = requestEntity.date;
        this.time = requestEntity.time;
        this.reason = requestEntity.reason;
        
        if (requestEntity.status) {
            this.status = requestEntity.status;
        } else {
            this.status = AttendanceRequestStatus.PENDING;
        }

        return this;
    }

    // Method for admin to review the request
    reviewRequest(
        status: AttendanceRequestStatus, 
        reviewedBy: string, 
        reviewNotes?: string
    ): void {
        this.status = status;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = new Date();
        this.reviewNotes = reviewNotes;
    }
}
