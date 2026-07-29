import { Column, Entity, JoinColumn, ManyToOne, Index, BeforeInsert } from "typeorm";
import { ILeaveTypeRequest, ILeaveTypeResponse, ITokenUser, GenderSpecific } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Department } from "./department";
import { generateCodeFromName, sanitizeString } from "../utility";

@Entity('LeaveType')
// Partial unique indexes: only enforced among non-deleted rows, so a soft-deleted
// leave type's code/name doesn't block creating a new one with the same value.
@Index(['companyId', 'code'], { unique: true, where: '"deleted" = false' }) // Ensure unique code per company
@Index(['companyId', 'name'], { unique: true, where: '"deleted" = false' }) // Ensure unique name per company
export class LeaveType extends CompanyEntityBase implements IToResponseBase<LeaveType, ILeaveTypeResponse> {
    
    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    maxDaysPerYear!: number;

    @Column({ type: 'int', default: 0 })
    maxConsecutiveDays!: number;

    @Column({ type: 'boolean', default: true })
    isPaid!: boolean;

    @Column({ type: 'boolean', default: true })
    requiresApproval!: boolean;

    @Column({ type: 'boolean', default: false })
    canBeCarriedForward!: boolean;

    @Column({ type: 'int', default: 0 })
    carryForwardLimit!: number;

    @Column({ 
        type: 'enum', 
        enum: GenderSpecific, 
        default: GenderSpecific.ALL 
    })
    genderSpecific!: GenderSpecific;

    // Relationship with Department - nullable and SET NULL on delete
    @ManyToOne(() => Department, { 
        nullable: true, 
        eager: false,
        onDelete: 'SET NULL' // This will set departmentId to NULL when department is deleted
    })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department?: Department;

    @BeforeInsert()
    beforeInsert() {
        // Generate code if not provided
        if (!this.code && this.name) {
            this.name = sanitizeString(this.name);
            this.code = generateCodeFromName(this.name);
        }
    }
    
    toResponse(entity?: LeaveType): ILeaveTypeResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            departmentId: entity.departmentId,
            name: entity.name,
            code: entity.code,
            description: entity.description,
            maxDaysPerYear: entity.maxDaysPerYear,
            maxConsecutiveDays: entity.maxConsecutiveDays,
            isPaid: entity.isPaid,
            requiresApproval: entity.requiresApproval,
            canBeCarriedForward: entity.canBeCarriedForward,
            carryForwardLimit: entity.carryForwardLimit,
            genderSpecific: entity.genderSpecific,
            department: entity.department ? entity.department.toResponse(entity.department) : undefined
        }
    }

    toEntity = (entityRequest: ILeaveTypeRequest, id?: string, contextUser?: ITokenUser): LeaveType => {
        this.departmentId = entityRequest.departmentId;
        this.name = entityRequest.name;
        this.code = entityRequest.code;
        this.description = entityRequest.description;
        this.maxDaysPerYear = entityRequest.maxDaysPerYear ?? 0;
        this.maxConsecutiveDays = entityRequest.maxConsecutiveDays ?? 0;
        this.isPaid = entityRequest.isPaid ?? true;
        this.requiresApproval = entityRequest.requiresApproval ?? true;
        this.canBeCarriedForward = entityRequest.canBeCarriedForward ?? false;
        this.carryForwardLimit = entityRequest.carryForwardLimit ?? 0;
        
        this.genderSpecific = entityRequest.genderSpecific && typeof entityRequest.genderSpecific === "string"
            ? (GenderSpecific[entityRequest.genderSpecific.toUpperCase() as keyof typeof GenderSpecific] ?? GenderSpecific.ALL)
            : (entityRequest.genderSpecific || GenderSpecific.ALL);

        // Set department if departmentId is provided
        if (entityRequest.departmentId) {
            let department = new Department();
            department.id = entityRequest.departmentId;
            this.department = department;
        }

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }
}