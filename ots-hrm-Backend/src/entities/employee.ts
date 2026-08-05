import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, Unique } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { EmployeeStatus, IEmployeeRequest, IEmployeeResponse } from "../models";
import { User } from "./user";
import { Department } from "./department";
import { Designation, } from "./designation";
import { Shift } from "./shift";
import { EmployeeBenefit } from "./employee-benefit";
import { ITokenUser } from "../models/inerfaces/tokenUser";

@Entity('Employee')
@Unique(['companyId', 'employeeCode'])
export class Employee extends CompanyEntityBase implements IToResponseBase<Employee, IEmployeeResponse> {
    
    // User Reference (One-to-One relationship)
    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    // Unique Employee Code
    @Column({ type: 'text', nullable: false })
    employeeCode!: string;

    // Department Reference
    @Column({ type: 'uuid', nullable: false })
    departmentId!: string;

    // Designation Reference
    @Column({ type: 'uuid', nullable: false })
    designationId!: string;

    // Current Shift Reference (for direct access)
    @Column({ type: 'uuid', nullable: true })
    shiftId?: string;

    // Employment Details
    @Column({ type: 'date', nullable: false })
    joiningDate!: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    salary?: number;

    @Column({ type: 'date', nullable: true })
    probationEndDate?: Date;

    // When the employee left (set on RESIGNED/TERMINATED/RETIRED, cleared on reactivation).
    @Column({ type: 'date', nullable: true })
    departureDate?: Date | null;

    // Optional - used for the Birthday notification feature (month+day recurrence).
    @Column({ type: 'date', nullable: true })
    dateOfBirth?: Date | null;

    // Business-timezone year the birthday/anniversary cron last notified for this
    // employee - comparing against the current year (not a boolean) is what lets the
    // dedup reset itself automatically every year with no separate cleanup. Internal
    // bookkeeping only - never exposed via toResponse(), same as
    // Company.lastEmployeeCodeNumber.
    @Column({ type: 'int', nullable: true })
    lastBirthdayNotifiedYear?: number | null;

    @Column({ type: 'int', nullable: true })
    lastAnniversaryNotifiedYear?: number | null;

    // Employee Status
    @Column({ 
        type: 'enum', 
        enum: EmployeeStatus,
        default: EmployeeStatus.PROBATION,
        nullable: false
    })
    status!: EmployeeStatus;

    // Additional Information
    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({ type: 'text', nullable: true })
    phoneNumber?: string;

    @Column({ type: 'text', nullable: true })
    emergencyContact?: string;

    // Bank Details
    @Column({ type: 'text', nullable: true })
    bankName?: string;

    @Column({ type: 'text', nullable: true })
    accountNumber?: string;

    @Column({ type: 'text', nullable: true })
    ibanNumber?: string;

    // Biometric device's internal employee ID (e.g. ZKTeco), for linking to the
    // external attendance-sync integration. The external API currently matches by
    // name, not this ID, but it's captured now for when the integration switches over.
    @Column({ type: 'text', nullable: true })
    zkDeviceUserId?: string;

    // Relations
    
    // User Relationship (One-to-One)
    @OneToOne(() => User, { 
        cascade: false, 
        nullable: false,
        eager: false 
    })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user?: User;

    // Department Relationship (Many-to-One)
    @ManyToOne(() => Department, { 
        nullable: false,
        eager: false
    })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department!: Department;

    // Designation Relationship (Many-to-One)
    @ManyToOne(() => Designation, { 
        nullable: false,
        eager: false
    })
    @JoinColumn({ name: 'designationId', referencedColumnName: 'id' })
    designation!: Designation;

    // Current Shift Relationship (Many-to-One)
    @ManyToOne(() => Shift, { 
        nullable: true,
        eager: false // Load only when needed
    })
    @JoinColumn({ name: 'shiftId', referencedColumnName: 'id' })
    shift?: Shift;

    // Employee Benefits Relationship (One-to-Many)
    @OneToMany(() => EmployeeBenefit, employeeBenefit => employeeBenefit.employee, {
        cascade: false,
        eager: false // Load only when needed
    })
    benefits?: EmployeeBenefit[];

    // Convert Entity to Response
    toResponse(entity?: Employee): IEmployeeResponse {
        if (!entity) entity = this;
        
        return {
            ...super.toCompanyResponseBase(entity),
            userId: entity.userId,
            employeeCode: entity.employeeCode,
            departmentId: entity.departmentId,
            designationId: entity.designationId,
            shiftId: entity.shiftId,
            joiningDate: entity.joiningDate,
            salary: entity.salary,
            status: entity.status,
            address: entity.address,
            phoneNumber: entity.phoneNumber,
            emergencyContact: entity.emergencyContact,
            probationEndDate: entity.probationEndDate,
            departureDate: entity.departureDate,
            dateOfBirth: entity.dateOfBirth,
            bankName: entity.bankName,
            accountNumber: entity.accountNumber,
            ibanNumber: entity.ibanNumber,
            zkDeviceUserId: entity.zkDeviceUserId,
            // Related entities (will be populated if loaded)
            user: entity.user ? entity.user.toResponse() : undefined,
            department: entity.department ? entity.department.toResponse() : undefined,
            designation: entity.designation ? entity.designation.toResponse() : undefined,
            shift: entity.shift ? entity.shift.toResponse() : undefined,
            benefits: entity.benefits ? entity.benefits.map(benefit => benefit.toResponse()) : undefined,
        };
    }

    // Convert Request to Entity
    toEntity(requestEntity: IEmployeeRequest, id?: string, contextUser?: ITokenUser): Employee {
        this.userId = requestEntity.userId;
        this.employeeCode = requestEntity.employeeCode;
        this.departmentId = requestEntity.departmentId;
        this.designationId = requestEntity.designationId;
        this.shiftId = requestEntity.shiftId;
        this.joiningDate = requestEntity.joiningDate;
        this.salary = requestEntity.salary;
        this.status = requestEntity.status ?? EmployeeStatus.PROBATION; // Default to Probation if not provided
        this.address = requestEntity.address;
        this.phoneNumber = requestEntity.phoneNumber;
        this.emergencyContact = requestEntity.emergencyContact;
        this.probationEndDate = requestEntity.probationEndDate;
        this.departureDate = requestEntity.departureDate;
        this.dateOfBirth = requestEntity.dateOfBirth;
        this.bankName = requestEntity.bankName;
        this.accountNumber = requestEntity.accountNumber;
        this.ibanNumber = requestEntity.ibanNumber;
        this.zkDeviceUserId = requestEntity.zkDeviceUserId;

        if (contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper Methods

    // Check if employee is active
    isActive(): boolean {
        return this.active === true
    }

    // Check if employee is on probation
    isOnProbation(): boolean {
        return this.status === EmployeeStatus.PROBATION;
    }

    // Get full name from user
    getFullName(): string {
        if (!this.user) return '';
        return `${this.user.firstName} ${this.user.middleName || ''} ${this.user.lastName}`.trim();
    }

    // Calculate tenure in months
    getTenureInMonths(): number {
        const now = new Date();
        const joining = new Date(this.joiningDate);
        const diffTime = Math.abs(now.getTime() - joining.getTime());
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        return diffMonths;
    }

    // Whether a full year has elapsed since joining, as of `asOf` (default now).
    // Uses calendar-based date arithmetic (not a 365-day/30-day approximation like
    // getTenureInMonths()) so it's exact regardless of leap years - e.g. gates
    // eligibility for tenure-restricted leave types like Annual Leave.
    hasCompletedOneYear(asOf: Date = new Date()): boolean {
        const oneYearAfterJoining = new Date(this.joiningDate);
        oneYearAfterJoining.setFullYear(oneYearAfterJoining.getFullYear() + 1);
        return asOf >= oneYearAfterJoining;
    }

    // Whole years elapsed since joining, as of `asOf` - the work-anniversary ordinal
    // (1st, 2nd, 3rd...). Same calendar-based arithmetic as hasCompletedOneYear(),
    // just expressed as a count rather than a boolean.
    getYearsOfService(asOf: Date = new Date()): number {
        const joining = new Date(this.joiningDate);
        let years = asOf.getFullYear() - joining.getFullYear();
        const anniversaryThisYear = new Date(joining);
        anniversaryThisYear.setFullYear(asOf.getFullYear());
        if (asOf < anniversaryThisYear) years--;
        return Math.max(0, years);
    }

    // True if `date`'s month+day matches `asOf`'s month+day, independent of year -
    // the shared recurrence rule behind both birthdays and work anniversaries.
    private static matchesMonthDay(date: Date, asOf: Date): boolean {
        return date.getMonth() === asOf.getMonth() && date.getDate() === asOf.getDate();
    }

    isBirthdayToday(asOf: Date = new Date()): boolean {
        if (!this.dateOfBirth) return false;
        return Employee.matchesMonthDay(new Date(this.dateOfBirth), asOf);
    }

    // Requires at least one full year of service so the hire date itself is never
    // misreported as a "0th anniversary".
    isAnniversaryToday(asOf: Date = new Date()): boolean {
        return Employee.matchesMonthDay(new Date(this.joiningDate), asOf) && this.getYearsOfService(asOf) >= 1;
    }

    // Enhanced onStatusChange method with better logging
    onStatusChange(newStatus: EmployeeStatus, departureDate?: Date | string): void {
        // Update the status
        this.status = newStatus;

        // If the new status is retired, resigned, or terminated, set active to false
        if ([EmployeeStatus.RETIRED, EmployeeStatus.RESIGNED, EmployeeStatus.TERMINATED].includes(newStatus)) {
            this.active = false;
            // Record when they left — use the supplied date, default to today.
            this.departureDate = departureDate ? new Date(departureDate) : new Date();
        } else {
            // For other statuses (like Active, OnLeave, etc.), you might want to set active to true
            this.active = true;
            // Reactivation/correction clears the departure date (null so the DB column is cleared,
            // not skipped — partialUpdate uses TypeORM .update(), which ignores undefined).
            this.departureDate = null;
        }

    }
}