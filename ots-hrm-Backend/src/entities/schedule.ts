import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { ITokenUser, ScheduleType, WorkType, ISchedulerRequest, ISchedulerResponse } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { ICompanyResponseBase } from "../models/inerfaces/response/response-base";
import { User } from "./user";
import { Employee } from "./employee";



@Entity('Scheduler')
// @Index('idx_user_schedule_date', ['companyId', 'userId', 'scheduleDate'])
// @Index('idx_schedule_date', ['companyId', 'scheduleDate'])
// @Index('unique_user_schedule_date', ['companyId', 'userId', 'scheduleDate'], { unique: true })
export class Scheduler extends CompanyEntityBase implements IToResponseBase<Scheduler, ISchedulerResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'date', nullable: false })
    scheduleDate!: Date;

    @Column({ type: 'time', nullable: false })
    startTime!: string; // Modified start time

    @Column({ type: 'time', nullable: false })
    endTime!: string; // Modified end time

    @Column({ type: 'varchar', length: 20, default: ScheduleType.CUSTOM })
    scheduleType!: ScheduleType;

    @Column({ type: 'varchar', length: 20, default: WorkType.ONSITE })
    workType?: WorkType; // Default 'onsite'

    @Column({ type: 'varchar', length: 255, nullable: true })
    reason?: string; // Why schedule was modified

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'boolean', default: true })
    isPaidOvertime!: boolean;

    @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;
    
    toResponse(entity?: Scheduler): ISchedulerResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            userId: entity.userId,
            scheduleDate: entity.scheduleDate,
            startTime: entity.startTime,
            endTime: entity.endTime,
            scheduleType: entity.scheduleType,
            workType: entity.workType ?? WorkType.ONSITE,
            reason: entity.reason,
            notes: entity.notes,
            isPaidOvertime: entity.isPaidOvertime,
            user: entity.user.toResponse(entity.user),
        }
    }

    toEntity = (entityRequest: ISchedulerRequest, id?: string, contextUser?: ITokenUser): Scheduler => {
        this.userId = entityRequest.userId;
        this.scheduleDate = entityRequest.scheduleDate;
        this.startTime = entityRequest.startTime;
        this.endTime = entityRequest.endTime;
        this.scheduleType = entityRequest.scheduleType ?? ScheduleType.CUSTOM;
        this.workType = entityRequest.workType ?? WorkType.ONSITE;
        this.reason = entityRequest.reason;
        this.notes = entityRequest.notes;
        this.isPaidOvertime = entityRequest.isPaidOvertime ?? true;

        // Set user object
        let user = new User();
        user.id = entityRequest.userId;
        this.user = user;

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper method to calculate total working hours in minutes
    getTotalWorkingHours(): number {
        if (!this.startTime || !this.endTime) return 0;
        
        try {
            const start = new Date(`2000-01-01T${this.startTime}`);
            const end = new Date(`2000-01-01T${this.endTime}`);
            
            if (end <= start) {
                // Handle next day scenario (night shift)
                const nextDayEnd = new Date(`2000-01-02T${this.endTime}`);
                return Math.round((nextDayEnd.getTime() - start.getTime()) / (1000 * 60));
            }
            
            return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        } catch (error) {
            return 0;
        }
    }

    // Helper method to check if schedule is for today
    isToday(): boolean {
        const today = new Date();
        const scheduleDate = new Date(this.scheduleDate);
        
        return today.getFullYear() === scheduleDate.getFullYear() &&
               today.getMonth() === scheduleDate.getMonth() &&
               today.getDate() === scheduleDate.getDate();
    }

    // Helper method to check if schedule is in the past
    isPastSchedule(): boolean {
        const today = new Date();
        const scheduleDate = new Date(this.scheduleDate);
        
        today.setHours(0, 0, 0, 0);
        scheduleDate.setHours(0, 0, 0, 0);
        
        return scheduleDate < today;
    }

    // Static method to validate time format
    static isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    // Static method to validate schedule date range
    static isValidScheduleTime(startTime: string, endTime: string): boolean {
        if (!this.isValidTimeFormat(startTime) || !this.isValidTimeFormat(endTime)) {
            return false;
        }
        
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        
        // Allow next day scenarios for night shifts
        return start !== end;
    }
}