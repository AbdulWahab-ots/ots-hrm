import { Column, Entity, JoinColumn, ManyToOne, Index } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { Employee } from "./employee";
import { User } from "./user";
import { Department } from "./department";
import { IAttendanceSummaryRequest, IAttendanceSummaryResponse, ITokenUser } from "../models";

@Entity('AttendanceSummary')
@Index(['companyId', 'employeeId', 'attendanceMonth', 'attendanceYear'], { unique: true })
export class AttendanceSummary extends CompanyEntityBase implements IToResponseBase<AttendanceSummary, IAttendanceSummaryResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    employeeId!: string;

    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;

    @Column({ type: 'int', nullable: false })
    attendanceMonth!: number; // 1-12

    @Column({ type: 'int', nullable: false })
    attendanceYear!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    status!: string;

    @Column({ type: 'int', default: 0 })
    monthDays!: number;

    @Column({ type: 'int', default: 0 })
    offDays!: number;

    @Column({ type: 'int', default: 0 })
    totalWorkingDays!: number;

    @Column({ type: 'int', default: 0 })
    presentDays!: number;

    @Column({ type: 'int', default: 0 })
    absentDays!: number;

    @Column({ type: 'int', default: 0 })
    leaveDays!: number;

    @Column({ type: 'int', default: 0 })
    publicHolidays!: number;

    @Column({ type: 'int', default: 0 })
    earlyLeaveDays!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    totalWorkingHours!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    totalExpectedWorkingHours!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    totalLockedWorkingHours!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    totalEarlyLeaveHours!: number;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Relations
    @ManyToOne(() => Employee, { nullable: false, eager: false })
    @JoinColumn({ name: 'employeeId', referencedColumnName: 'id' })
    employee!: Employee;

    @ManyToOne(() => User, { nullable: false, eager: false })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => Department, { nullable: true, eager: false })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department?: Department;

    // Methods
    toResponse(entity?: AttendanceSummary): IAttendanceSummaryResponse {
        const attendanceSummary = entity || this;
        return {
            id: attendanceSummary.id,
            companyId: attendanceSummary.companyId,
            employeeId: attendanceSummary.employeeId,
            userId: attendanceSummary.userId,
            departmentId: attendanceSummary.departmentId,
            attendanceMonth: attendanceSummary.attendanceMonth,
            attendanceYear: attendanceSummary.attendanceYear,
            status: attendanceSummary.status,
            monthDays: attendanceSummary.monthDays,
            offDays: attendanceSummary.offDays,
            totalWorkingDays: attendanceSummary.totalWorkingDays,
            presentDays: attendanceSummary.presentDays,
            absentDays: attendanceSummary.absentDays,
            leaveDays: attendanceSummary.leaveDays,
            publicHolidays: attendanceSummary.publicHolidays,
            earlyLeaveDays: attendanceSummary.earlyLeaveDays,
            totalWorkingHours: attendanceSummary.totalWorkingHours,
            totalExpectedWorkingHours: attendanceSummary.totalExpectedWorkingHours,
            totalLockedWorkingHours: attendanceSummary.totalLockedWorkingHours,
            totalEarlyLeaveHours: attendanceSummary.totalEarlyLeaveHours,
            notes: attendanceSummary.notes,
            createdAt: attendanceSummary.createdAt,
            active: attendanceSummary.active,
            createdBy: attendanceSummary.createdBy,
            createdById: attendanceSummary.createdById,
            // Relations
            employee: attendanceSummary.employee ? {
                id: attendanceSummary.employee.id,
                employeeCode: attendanceSummary.employee.employeeCode,
                user: attendanceSummary.employee.user ? {
                    id: attendanceSummary.employee.user.id,
                    firstName: attendanceSummary.employee.user.firstName,
                    lastName: attendanceSummary.employee.user.lastName,
                    email: attendanceSummary.employee.user.email
                } : undefined
            } : undefined,
            user: attendanceSummary.user ? {
                id: attendanceSummary.user.id,
                firstName: attendanceSummary.user.firstName,
                lastName: attendanceSummary.user.lastName,
                email: attendanceSummary.user.email
            } : undefined,
            department: attendanceSummary.department ? {
                id: attendanceSummary.department.id,
                name: attendanceSummary.department.name
            } : undefined
        };
    }

    toEntity = (requestEntity: IAttendanceSummaryRequest, id?: string, contextUser?: ITokenUser): AttendanceSummary => {
        this.employeeId = requestEntity.employeeId;
        this.userId = requestEntity.userId;
        this.departmentId = requestEntity.departmentId;
        this.attendanceMonth = requestEntity.attendanceMonth;
        this.attendanceYear = requestEntity.attendanceYear;
        this.status = requestEntity.status;
        this.monthDays = requestEntity.monthDays || 0;
        this.offDays = requestEntity.offDays || 0;
        this.totalWorkingDays = requestEntity.totalWorkingDays || 0;
        this.presentDays = requestEntity.presentDays || 0;
        this.absentDays = requestEntity.absentDays || 0;
        this.leaveDays = requestEntity.leaveDays || 0;
        this.publicHolidays = requestEntity.publicHolidays || 0;
        this.earlyLeaveDays = requestEntity.earlyLeaveDays || 0;
        this.totalWorkingHours = Number(requestEntity.totalWorkingHours) || 0;
        this.totalExpectedWorkingHours = Number(requestEntity.totalExpectedWorkingHours) || 0;
        this.totalLockedWorkingHours = Number(requestEntity.totalLockedWorkingHours) || 0;
        this.totalEarlyLeaveHours = Number(requestEntity.totalEarlyLeaveHours) || 0;
        this.notes = requestEntity.notes;

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Business Logic Methods
    getAttendancePercentage(): number {
        if (this.totalWorkingDays === 0) return 0;
        return Math.floor((this.presentDays / this.totalWorkingDays) * 100);
    }

    getAttendancePeriod(): string {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[this.attendanceMonth - 1]} ${this.attendanceYear}`;
    }

    getTotalDays(): number {
        return this.totalWorkingDays + this.offDays;
    }

    getWorkingHoursEfficiency(): number {
        if (this.totalExpectedWorkingHours === 0) return 0;
        return Math.round((this.totalLockedWorkingHours / this.totalExpectedWorkingHours) * 100);
    }
}
