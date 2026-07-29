import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Index } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { User } from "./user";
import { ITokenUser } from "../models/inerfaces/tokenUser";
import { AttendanceBreak } from "./attendance-break";
import { AttendanceStatus, IAttendanceRequest, IAttendanceResponse, PresentStatus } from "../models";
import { Vacation } from "./vacation"; // Make sure this import exists
import { PublicHoliday } from "./public-holiday"; // Make sure this import exists
import { Shift } from "./shift"; // Import Shift entity

@Entity('Attendance')
@Index(['userId', 'date'], { unique: true })
export class Attendance extends CompanyEntityBase implements IToResponseBase<Attendance, IAttendanceResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'uuid', nullable: true })
    shiftId?: string;

    @Column({ type: 'date', nullable: false })
    date!: Date;

    // Store only time in 24-hour format (HH:MM:SS)
    @Column({ type: 'time', nullable: true })
    checkInTime?: string;

    // Store only time in 24-hour format (HH:MM:SS)
    @Column({ type: 'time', nullable: true })
    checkOutTime?: string;

    @Column({ 
        type: 'enum', 
        enum: AttendanceStatus,
        default: AttendanceStatus.DEFAULT,
        nullable: false 
    })
    status!: AttendanceStatus;

    @Column({ 
        type: 'enum', 
        enum: PresentStatus,
        nullable: true, 
    })
    presentStatus?: PresentStatus;

    // Renamed from workingHours to lockWorkingHours - stores actual worked duration
    @Column({ 
        type: 'decimal', 
        precision: 5, 
        scale: 2, 
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseFloat(value) : value
        }
    })
    lockWorkingHours?: number;

    // New field: Total working hours required from shift
    @Column({ 
        type: 'decimal', 
        precision: 5, 
        scale: 2, 
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseFloat(value) : value
        }
    })
    totalWorkingHours?: number;

    // New field: Minimum required working hours (with margin time consideration)
    @Column({ 
        type: 'decimal', 
        precision: 5, 
        scale: 2, 
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseFloat(value) : value
        }
    })
    minimumRequiredWorkingHour?: number;

    @Column({ 
        type: 'decimal', 
        precision: 5, 
        scale: 2, 
        nullable: true,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseFloat(value) : value
        }
    })
    totalBreakTime?: number;

    @Column({ type: 'int', default: 0 })
    lateMinutes!: number;

    @Column({ type: 'int', default: 0 })
    earlyLeaveMinutes!: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'text', nullable: true })
    location?: string;

    @Column({ type: 'boolean', default: false })
    isRemote!: boolean;

    // Add explicit vacation and public holiday fields
    @Column({ type: 'uuid', nullable: true })
    vacationId?: string;

    @ManyToOne(() => Vacation, { nullable: true, eager: false })
    @JoinColumn({ name: 'vacationId', referencedColumnName: 'id' })
    vacation?: Vacation;

    @Column({ type: 'uuid', nullable: true })
    publicHolidayId?: string;

    @ManyToOne(() => PublicHoliday, { nullable: true, eager: false })
    @JoinColumn({ name: 'publicHolidayId', referencedColumnName: 'id' })
    publicHoliday?: PublicHoliday;

    @Column({ type: 'uuid', nullable: true })
    remoteWorkId?: string;

    @ManyToOne(() => Vacation, { nullable: true, eager: false })
    @JoinColumn({ name: 'remoteWorkId', referencedColumnName: 'id' })
    remoteWork?: Vacation;

    // Relations
    @ManyToOne(() => User, { nullable: false, eager: false })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => Shift, { nullable: true, eager: false })
    @JoinColumn({ name: 'shiftId', referencedColumnName: 'id' })
    shift?: Shift;

    @OneToMany(() => AttendanceBreak, (breakRecord) => breakRecord.attendance, { cascade: true })
    breaks!: AttendanceBreak[];

    // Virtual property to get absenceReason based on which is set
    get absenceReason(): Vacation | PublicHoliday | null {
        if (this.vacation) return this.vacation;
        if (this.publicHoliday) return this.publicHoliday;
        if (this.remoteWork) return this.remoteWork;
        return null;
    }

    toResponse(entity?: Attendance): IAttendanceResponse {
        if (!entity) entity = this;
        
        return {
            ...super.toCompanyResponseBase(entity),
            userId: entity.userId,
            shiftId: entity.shiftId,
            date: entity.date,
            checkInTime: entity.checkInTime,
            checkOutTime: entity.checkOutTime,
            status: entity.status,
            presentStatus: entity.presentStatus,
            lockWorkingHours: entity.lockWorkingHours,
            totalWorkingHours: entity.totalWorkingHours,
            minimumRequiredWorkingHour: entity.minimumRequiredWorkingHour,
            totalBreakTime: entity.totalBreakTime,
            lateMinutes: entity.lateMinutes,
            earlyLeaveMinutes: entity.earlyLeaveMinutes,
            notes: entity.notes,
            location: entity.location,
            isRemote: entity.isRemote,
            vacationId: entity.vacationId,
            publicHolidayId: entity.publicHolidayId,
            remoteWorkId: entity.remoteWorkId,
            user: entity.user ? entity.user.toResponse() : undefined,
            shift: entity.shift ? entity.shift.toResponse() : undefined,
            absenceReason: entity.absenceReason
                ? (entity.absenceReason.toResponse?.() as any)
                : undefined,
            breaks: entity.breaks ? entity.breaks.map(b => b.toResponse()) : undefined
        };
    }

    toEntity(requestEntity: IAttendanceRequest, id?: string, contextUser?: ITokenUser): Attendance {
        this.userId = requestEntity.userId;
        this.shiftId = requestEntity.shiftId;
        this.date = requestEntity.date; // Store date string as-is
        this.checkInTime = requestEntity.checkInTime; // Store time string as-is
        this.checkOutTime = requestEntity.checkOutTime; // Store time string as-is   
        this.status = requestEntity.status;
        this.presentStatus = requestEntity.presentStatus || undefined;
        this.lockWorkingHours = requestEntity.workingHours; // Map from workingHours to lockWorkingHours
        this.totalWorkingHours = requestEntity.totalWorkingHours; // Map total working hours from shift
        this.minimumRequiredWorkingHour = requestEntity.minimumRequiredWorkingHour; // Map minimum required hours from shift
        this.lateMinutes = requestEntity.lateMinutes || 0;
        this.notes = requestEntity.notes;
        this.location = requestEntity.location;
        this.isRemote = requestEntity.isRemote || false;
        this.vacationId = (requestEntity as any).vacationId;
        this.publicHolidayId = (requestEntity as any).publicHolidayId;
        this.remoteWorkId = (requestEntity as any).remoteWorkId;
        
        if (contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper method to parse time string to minutes for calculations
    private parseTimeToMinutes(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Calculate actual working hours (lockWorkingHours) excluding breaks
    calculateLockWorkingHours(): number {
        if (!this.checkInTime || !this.checkOutTime) return 0;

        const checkInMinutes = this.parseTimeToMinutes(this.checkInTime);
        const checkOutMinutes = this.parseTimeToMinutes(this.checkOutTime);
        
        let totalMinutes = checkOutMinutes - checkInMinutes;
        
        // Handle overnight shifts (checkout next day)
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // Add 24 hours worth of minutes
        }

        const breakMinutes = this.totalBreakTime ? this.totalBreakTime * 60 : 0;
        const workingMinutes = Math.max(0, totalMinutes - breakMinutes);
        
        return Math.round((workingMinutes / 60) * 100) / 100;
    }

    // Calculate early leave minutes based on shift requirements
    calculateEarlyLeaveMinutes(): number {
        if (!this.minimumRequiredWorkingHour || !this.lockWorkingHours) return 0;

        const requiredMinutes = this.minimumRequiredWorkingHour * 60;
        const actualMinutes = this.lockWorkingHours * 60;

        // Math.round — earlyLeaveMinutes is an int column, float would cause a DB error
        return Math.round(Math.max(0, requiredMinutes - actualMinutes));
    }

    // Update shift-based working hour requirements
    updateShiftWorkingHours(shift: Shift): void {
        if (shift) {
            // Convert shift working hours from minutes to hours
            this.totalWorkingHours = Math.round((shift.workingHours / 60) * 100) / 100;
            // Calculate minimum required hours (excluding margin time)
            this.minimumRequiredWorkingHour = Math.round(((shift.workingHours - shift.marginTime) / 60) * 100) / 100;
        }
    }

    // Calculate total break time from all breaks
    calculateTotalBreakTime(): number {
        if (!this.breaks || this.breaks.length === 0) return 0;
        
        return this.breaks.reduce((total, breakRecord) => {
            return total + (breakRecord.getDurationInHours() || 0);
        }, 0);
    }

    // Check if employee is currently on break
    isCurrentlyOnBreak(): boolean {
        if (!this.breaks || this.breaks.length === 0) return false;
        return this.breaks.some(breakRecord => breakRecord.isOngoing());
    }

    // Get current active break
    getCurrentBreak(): AttendanceBreak | undefined {
        if (!this.breaks || this.breaks.length === 0) return undefined;
        return this.breaks.find(breakRecord => breakRecord.isOngoing());
    }

    // Get total number of breaks taken
    getTotalBreaksCount(): number {
        return this.breaks ? this.breaks.length : 0;
    }

    // Check if attendance is based on approved leave
    isOnApprovedLeave(): boolean {
        return this.status === AttendanceStatus.ON_LEAVE && !!this.vacationId;
    }

    // Check if attendance is due to public holiday
    isPublicHoliday(): boolean {
        return this.status === AttendanceStatus.HOLIDAY && !!this.publicHolidayId;
    }

    // Check if attendance is for remote work
    isRemoteWork(): boolean {
        return !!this.remoteWorkId && this.isRemote;
    }

    // Get attendance type for reporting
    getAttendanceType(): 'working' | 'leave' | 'holiday' | 'dayoff' | 'remote' | 'absent' {
        if (this.isPublicHoliday()) return 'holiday';
        if (this.isOnApprovedLeave()) return 'leave';
        if (this.isRemoteWork()) return 'remote';
        if (this.status === AttendanceStatus.DAY_OFF) return 'dayoff';
        if (this.status === AttendanceStatus.PRESENT || this.status === AttendanceStatus.LATE || this.status === AttendanceStatus.HALF_DAY) return 'working';
        return 'absent';
    }

    // Helper method to get absenceReason entity info
    getAbsenceReasonInfo(): { id: string; type: 'Vacation' | 'PublicHoliday' | 'RemoteWork' } | null {
        if (this.vacationId) return { id: this.vacationId, type: 'Vacation' };
        if (this.publicHolidayId) return { id: this.publicHolidayId, type: 'PublicHoliday' };
        if (this.remoteWorkId) return { id: this.remoteWorkId, type: 'RemoteWork' };
        return null;
    }

    // Set absenceReason reference
    setVacation(id: string): void {
        this.vacationId = id;
        this.publicHolidayId = undefined;
        this.remoteWorkId = undefined;
    }

    setPublicHoliday(id: string): void {
        this.publicHolidayId = id;
        this.vacationId = undefined;
        this.remoteWorkId = undefined;
    }

    setRemoteWork(id: string): void {
        this.remoteWorkId = id;
        this.vacationId = undefined;
        this.publicHolidayId = undefined;
    }

    // Clear absenceReason reference
    clearAbsenceReason(): void {
        this.vacationId = undefined;
        this.publicHolidayId = undefined;
        this.remoteWorkId = undefined;
    }

    // Check if it's a full working day
    isFullWorkingDay(): boolean {
        return this.status === AttendanceStatus.PRESENT && 
               this.checkInTime !== undefined && 
               this.checkOutTime !== undefined;
    }

    // Auto calculate and update working hours
    updateWorkingHours(): void {
        this.totalBreakTime = this.calculateTotalBreakTime();
        this.lockWorkingHours = this.calculateLockWorkingHours();
        this.earlyLeaveMinutes = this.calculateEarlyLeaveMinutes();
    }

    // Helper methods for check-in/check-out operations
    checkIn(date: Date, time: string): void {
        this.date = date;
        this.checkInTime = time;
        this.status = AttendanceStatus.PRESENT;
        this.presentStatus = PresentStatus.CHECK_IN;
    }

    checkOut(time: string): void {
        this.checkOutTime = time;
        this.presentStatus = PresentStatus.CHECK_OUT;
        this.updateWorkingHours(); // Calculate working hours on checkout
    }

    // Get full datetime for check-in (combining date + time)
    getCheckInDateTime(): Date | null {
        if (!this.checkInTime || !this.date) return null;
        
        const [hours, minutes, seconds] = this.checkInTime.split(':').map(Number);
        const dateTime = new Date(this.date + 'T00:00:00.000Z');
        dateTime.setUTCHours(hours, minutes, seconds || 0, 0);
        return dateTime;
    }

    // Get full datetime for check-out (combining date + time)
    getCheckOutDateTime(): Date | null {
        if (!this.checkOutTime || !this.date) return null;
        
        const [hours, minutes, seconds] = this.checkOutTime.split(':').map(Number);
        const dateTime = new Date(this.date + 'T00:00:00.000Z');
        dateTime.setUTCHours(hours, minutes, seconds || 0, 0);
        
        // Handle overnight shifts - if checkout time is before checkin time, add a day
        if (this.checkInTime && this.parseTimeToMinutes(this.checkOutTime) < this.parseTimeToMinutes(this.checkInTime)) {
            dateTime.setUTCDate(dateTime.getUTCDate() + 1);
        }
        
        return dateTime;
    }
}