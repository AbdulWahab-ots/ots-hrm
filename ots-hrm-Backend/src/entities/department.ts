import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Index, BeforeInsert, BeforeUpdate, ManyToMany } from "typeorm";
import { IDepartmentRequest, IDepartmentResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Designation } from "./designation"; // Import Designation entity
import { generateCodeFromName, sanitizeString } from "../utility";
import { PublicHoliday } from "./public-holiday";
import { WorkingDays } from './working-days';
import { Shift } from './shift';
import { Benefit } from './benefit';

@Entity('Department')
// Partial unique indexes: only enforced among non-deleted rows, so a soft-deleted
// department's name/code doesn't block creating a new one with the same name/code.
@Index(['companyId', 'code'], { unique: true, where: '"deleted" = false' })
@Index(['companyId', 'name'], { unique: true, where: '"deleted" = false' })
export class Department extends CompanyEntityBase implements IToResponseBase<Department, IDepartmentResponse> {
    
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    parentId?: string;

    @Column({ type: 'int', nullable: true })
    sortOrder?: number;

    // Self-referencing relationship for hierarchical departments
    @ManyToOne(() => Department, (department) => department.children, { 
        nullable: true, 
        eager: false 
    })
    @JoinColumn({ name: 'parentId', referencedColumnName: 'id' })
    parent?: Department;

    @OneToMany(() => Department, (department) => department.parent)
    children!: Department[];

    @OneToMany(() => Designation, (designation) => designation.department, {
        eager: false
    })
    designations!: Designation[];

    @OneToMany(() => PublicHoliday, publicHoliday => publicHoliday.department)
    publicHolidays?: PublicHoliday[];

    @OneToMany(() => WorkingDays, workingDays => workingDays.department, {
        eager: false
    })
    workingDays?: WorkingDays[];

    @OneToMany(() => Shift, shift => shift.department, {
        eager: false
    })
    shifts?: Shift[];

    @OneToMany(() => Benefit, benefit => benefit.department, {
        eager: false
    })
    benefits?: Benefit[];

    @BeforeInsert()
    beforeInsert() {
        if (!this.code && this.name) {
            this.name = sanitizeString(this.name);
            this.code = generateCodeFromName(this.name);
        }
    }
    
    toResponse(entity?: Department): IDepartmentResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            code: entity.code,
            description: entity.description,
            parentId: entity.parentId,
            sortOrder: entity.sortOrder,
            parent: entity.parent ? entity.parent.toResponse(entity.parent) : undefined,
            children: entity.children ? entity.children.map(child => child.toResponse(child)) : [],
            designations: entity.designations ? entity.designations.map(designation => designation.toResponse(designation)) : [],
            workingDays: entity.workingDays ? entity.workingDays.map(workingDay => workingDay.toSpecificResponse(workingDay)).sort((a, b) => a.dayOfWeek - b.dayOfWeek) : [],
            shifts: entity.shifts ? entity.shifts.map(shift => shift.toSpecificResponse(shift)) : [],
            benefits: entity.benefits ? entity.benefits.map(benefit => benefit.toResponse(benefit)) : []
        }
    }

    toEntity = (entityRequest: IDepartmentRequest, id?: string, contextUser?: ITokenUser): Department => {
        this.name = entityRequest.name;
        this.code = entityRequest.code;
        this.description = entityRequest.description;
        this.parentId = entityRequest.parentId;
        this.sortOrder = entityRequest.sortOrder;

        // Set parent department if parentId is provided
        if (entityRequest.parentId) {
            let parent = new Department();
            parent.id = entityRequest.parentId;
            this.parent = parent;
        }

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }
}