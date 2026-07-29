import { BeforeInsert, BeforeUpdate, Column, Entity, Index, ManyToOne, JoinColumn } from "typeorm";
import { ITokenUser, ShiftType, IShiftRequest,IShiftResponse, IGeneralShiftResponse } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { generateCodeFromName, sanitizeString } from "../utility";
import { Department } from "./department";

@Entity('Shift')
// Updated unique constraints to support both company-wide and department-specific shifts.
// Partial (where deleted = false) so a soft-deleted shift's name/code doesn't block
// creating a new one with the same value.
@Index(['companyId', 'code', 'departmentId'], { unique: true, where: '"deleted" = false' }) // Unique code per company/department
@Index(['companyId', 'name', 'departmentId'], { unique: true, where: '"deleted" = false' }) // Unique name per company/department
@Index(['companyId', 'departmentId', 'order']) // Index for ordering shifts
export class Shift extends CompanyEntityBase implements IToResponseBase<Shift, IShiftResponse> {
    
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    code!: string;

    @Column({ type: 'enum', enum: ShiftType, nullable: false })
    shiftType!: ShiftType;

    @Column({ type: 'time', nullable: false })
    startTime!: string;

    @Column({ type: 'time', nullable: false })
    endTime!: string;

    @Column({ type: 'int', nullable: false })
    workingHours!: number; // Working hours in minutes

    @Column({ type: 'int', default: 30 })
    marginTime!: number; // Margin time in minutes, default 30 minutes

    @Column({ type: 'int', default: 0 })
    breakDuration!: number; // Break duration in minutes

    @Column({ type: 'int', default: 0 })
    order!: number; // Order/sequence of shift

    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;

    @ManyToOne(() => Department, { nullable: true, eager: false })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department?: Department;


    @BeforeInsert()
    beforeInsert() {
        this.processNameAndCode();
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.processNameAndCode();
    }

    private processNameAndCode() {
        // Sanitize name first
        if (this.name) {
            this.name = sanitizeString(this.name);
        }
        
        // Always regenerate code based on current name and department
        if (this.name) {
            // If department-specific, include department info in code generation
            if (this.departmentId) {
                this.code = generateCodeFromName(`${this.name} Dept`);
            } else {
                this.code = generateCodeFromName(this.name);
            }
        }

        // Recalculate working hours if start/end times are available
        if (this.startTime && this.endTime) {
            this.workingHours = Shift.calculateWorkingHours(this.startTime, this.endTime);
        }
    }
    
    toResponse(entity?: Shift): IShiftResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            code: entity.code,
            shiftType: entity.shiftType,
            startTime: entity.startTime,
            endTime: entity.endTime,
            workingHours: entity.workingHours,
            marginTime: entity.marginTime,
            breakDuration: entity.breakDuration,
            order: entity.order,
            departmentId: entity.departmentId,
            department: entity.department ? entity.department.toResponse(entity.department) : undefined
        }
    }

    toSpecificResponse(entity?: Shift): IGeneralShiftResponse {
        if(!entity) entity = this;
        return {
            id: entity.id,
            name: entity.name,
            code: entity.code,
            shiftType: entity.shiftType,
            startTime: entity.startTime,
            endTime: entity.endTime,
            workingHours: entity.workingHours,
            marginTime: entity.marginTime,
            breakDuration: entity.breakDuration,
            order: entity.order
        }
    }


    toEntity = (entityRequest: IShiftRequest, id?: string, contextUser?: ITokenUser): Shift => {
        this.name = entityRequest.name;
        // Don't set code here - always let the hooks handle it for consistency
        this.shiftType = entityRequest.shiftType;
        this.startTime = entityRequest.startTime;
        this.endTime = entityRequest.endTime;
        this.marginTime = entityRequest.marginTime ?? 30;
        this.breakDuration = entityRequest.breakDuration ?? 0;
        this.order = entityRequest.order ?? 0;
        this.departmentId = entityRequest.departmentId || undefined;
        
        // Calculate working hours automatically
        this.workingHours = Shift.calculateWorkingHours(entityRequest.startTime, entityRequest.endTime);

        if (entityRequest.departmentId) {
            const department = new Department();
            department.id = entityRequest.departmentId;
            this.department = department;
        }

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper method to calculate working hours in minutes
    static calculateWorkingHours(startTime: string, endTime: string): number {
        if (!startTime || !endTime) return 0;
        
        try {
            // Use current date instead of static 2000-01-01
            const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
            const start = new Date(`${today}T${startTime}`);
            const end = new Date(`${today}T${endTime}`);
            
            if (end <= start) {
                // Handle next day scenario (night shift)
                const nextDay = new Date(start);
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(end.getHours(), end.getMinutes(), end.getSeconds());
                return Math.round((nextDay.getTime() - start.getTime()) / (1000 * 60));
            }
            
            return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        } catch (error) {
            return 0;
        }
    }

    // Helper method to get net working hours (excluding break)
    getNetWorkingHours(): number {
        return Math.max(0, this.workingHours - this.breakDuration);
    }

    // Helper method to get minimum required working hours (including margin time)
    getMinimumRequiredHours(): number {
        return Math.max(0, this.workingHours - this.marginTime);
    }

    // Helper method to validate shift times
    static isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        return timeRegex.test(time);
    }
}