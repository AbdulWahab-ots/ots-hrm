import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Index } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { ITokenUser } from "../models/inerfaces/tokenUser";
import { Attendance } from './attendance';
import { BreakType, IBreakRequest, IBreakResponse } from "../models";
import { User } from "./user";



@Entity('Break')
@Index(['userId', 'startTime'])
export class AttendanceBreak extends CompanyEntityBase implements IToResponseBase<AttendanceBreak, IBreakResponse> {

    @Column({ type: 'uuid', nullable: false })
    attendanceId!: string;

    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'text', nullable: false })
    breakType!: BreakType;

    @Column({ type: 'timestamp', nullable: false })
    startTime!: Date;

    @Column({ type: 'timestamp', nullable: true })
    endTime?: Date;

    @Column({ type: 'int', nullable: true })
    durationMinutes?: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'text', nullable: true })
    location?: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    // Relations
    @ManyToOne(() => Attendance, (attendance) => attendance.breaks, { nullable: false })
    @JoinColumn({ name: 'attendanceId', referencedColumnName: 'id' })
    attendance!: Attendance;

    @ManyToOne(() => User, { nullable: false, eager: false })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    toResponse(entity?: AttendanceBreak): IBreakResponse {
        if (!entity) entity = this;
        
        return {
            ...super.toCompanyResponseBase(entity),
            attendanceId: entity.attendanceId,
            userId: entity.userId,
            breakType: entity.breakType,
            startTime: entity.startTime,
            endTime: entity.endTime,
            durationMinutes: entity.durationMinutes,
            notes: entity.notes,
            location: entity.location,
            isActive: entity.isActive,
            attendance: entity.attendance ? entity.attendance.toResponse() : undefined,
            user: entity.user ? entity.user.toResponse() : undefined 
        };
    }

    toEntity(requestEntity: IBreakRequest, id?: string, contextUser?: ITokenUser): AttendanceBreak {
        this.attendanceId = requestEntity.attendanceId;
        this.userId = requestEntity.userId;
        this.breakType = requestEntity.breakType;
        this.startTime = requestEntity.startTime;
        this.endTime = requestEntity.endTime;
        this.notes = requestEntity.notes;
        this.location = requestEntity.location;
        
        // Auto calculate duration if endTime is provided
        if (this.endTime) {
            this.durationMinutes = this.getDurationInMinutes();
            this.isActive = false;
        }
        
        if (contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper Methods
    getDurationInMinutes(): number {
        if (!this.endTime) return 0;
        return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
    }

    getDurationInHours(): number {
        return this.getDurationInMinutes() / 60;
    }

    isOngoing(): boolean {
        return !this.endTime && this.isActive;
    }

    endBreak(endTime?: Date): void {
        this.endTime = endTime || new Date();
        this.durationMinutes = this.getDurationInMinutes();
        this.isActive = false;
    }

    getFormattedDuration(): string {
        const minutes = this.getDurationInMinutes();
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${remainingMinutes}m`;
    }

    // Check if break is longer than expected (configurable)
    isLongBreak(maxMinutes: number = 60): boolean {
        return this.getDurationInMinutes() > maxMinutes;
    }

    // Get break status
    getBreakStatus(): 'ongoing' | 'completed' | 'overdue' {
        if (this.isOngoing()) {
            const currentDuration = Math.round((new Date().getTime() - this.startTime.getTime()) / (1000 * 60));
            // Consider lunch break overdue after 90 minutes, others after 30 minutes
            const overdueLimit = this.breakType === BreakType.LUNCH ? 90 : 30;
            return currentDuration > overdueLimit ? 'overdue' : 'ongoing';
        }
        return 'completed';
    }

    // Start break (set isActive to true)
    startBreak(): void {
        this.isActive = true;
        this.endTime = undefined;
        this.durationMinutes = undefined;
    }
}