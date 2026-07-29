import { Column, Entity, Index, Unique, ManyToOne, JoinColumn } from "typeorm";
import { ITokenUser, DayName, IWorkingDaysRequestSingle, IWorkingDaysResponse, IWorkingDaysForDepartmentResponse } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { ICompanyResponseBase } from "../models/inerfaces/response/response-base";
import { Department } from "./department";


@Entity('WorkingDays')
// Unique constraints to support both company-wide and department-specific working days
@Unique(['companyId', 'dayOfWeek', 'departmentId'])
@Index(['companyId', 'dayOfWeek', 'departmentId'], { unique: true })
export class WorkingDays extends CompanyEntityBase implements IToResponseBase<WorkingDays, IWorkingDaysResponse> {

    @Column({ type: 'smallint', nullable: false })
    dayOfWeek!: number; // 1=Monday, 2=Tuesday... 7=Sunday

    @Column({ type: 'enum', enum: DayName, nullable: false })
    dayName!: DayName;

    @Column({ type: 'boolean', default: true })
    isWorkingDay!: boolean;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;    
    
    @ManyToOne(() => Department, { nullable: true, eager: false })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department?: Department;
    
    toResponse(entity?: WorkingDays): IWorkingDaysResponse {
        if(!entity) entity = this;        return {
            ...super.toCompanyResponseBase(entity),
            dayOfWeek: entity.dayOfWeek,
            dayName: entity.dayName,
            isWorkingDay: entity.isWorkingDay,
            notes: entity.notes,
            departmentId: entity.departmentId,
            department: entity.department ? entity.department.toResponse(entity.department) : undefined
        }
    }

    toSpecificResponse(entity?: WorkingDays): IWorkingDaysForDepartmentResponse {
        if(!entity) entity = this;
        return {
            dayOfWeek: entity.dayOfWeek,
            dayName: entity.dayName,
            isWorkingDay: entity.isWorkingDay,
            notes: entity.notes,
        }
    }

    toEntity = (entityRequest: IWorkingDaysRequestSingle, id?: string, contextUser?: ITokenUser): WorkingDays => {
        this.dayOfWeek = WorkingDays.getDayNumber(entityRequest.dayName);
        this.dayName = entityRequest.dayName;
        this.isWorkingDay = entityRequest.isWorkingDay ?? true;
        this.notes = entityRequest.notes;
        this.departmentId = entityRequest.departmentId || undefined;

        if (entityRequest.departmentId) {
            const department = new Department();
            department.id = entityRequest.departmentId;
            this.department = department;
        }

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper method to get day number from day name
    static getDayNumber(dayName: DayName): number {
        const days: { [key in DayName]: number } = {
            [DayName.MONDAY]: 1,
            [DayName.TUESDAY]: 2,
            [DayName.WEDNESDAY]: 3,
            [DayName.THURSDAY]: 4,
            [DayName.FRIDAY]: 5,
            [DayName.SATURDAY]: 6,
            [DayName.SUNDAY]: 7
        };
        
        return days[dayName];
    }
}