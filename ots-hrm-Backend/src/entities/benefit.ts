import { Column, Entity, JoinColumn, ManyToOne, Index, BeforeInsert } from "typeorm";
import { IBenefitRequest, IBenefitResponse, ITokenUser, BenefitType, BenefitValueType, BenefitFrequency } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Department } from "./department";
import { generateCodeFromName, sanitizeString } from "../utility";

@Entity('Benefit')
// Partial unique indexes: only enforced among non-deleted rows, so a soft-deleted
// benefit's code/name doesn't block creating a new one with the same value.
@Index(['companyId', 'code', 'departmentId'], { unique: true, where: '"deleted" = false' }) // Code unique per company-department combination
@Index(['companyId', 'name', 'departmentId'], { unique: true, where: '"deleted" = false' }) // Name unique per company-department combination
export class Benefit extends CompanyEntityBase implements IToResponseBase<Benefit, IBenefitResponse> {
    
    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: BenefitType, nullable: false })
    type!: BenefitType;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    value?: number; // monetary value if applicable

    @Column({ type: 'enum', enum: BenefitValueType, nullable: true })
    valueType?: BenefitValueType;

    @Column({ type: 'enum', enum: BenefitFrequency, nullable: true })
    frequency?: BenefitFrequency;

    @Column({ type: 'date', nullable: true })
    startDate?: Date;

    @Column({ type: 'date', nullable: true })
    endDate?: Date;

    @Column({ type: 'int', nullable: true })
    sortOrder?: number;

    // Optional association with department - null means it's for the whole company
    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;

    @ManyToOne(() => Department, (department) => department.benefits, { 
        nullable: true, 
        eager: false 
    })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department?: Department;

    @BeforeInsert()
    beforeInsert() {
        if (!this.code && this.name) {
            this.name = sanitizeString(this.name);
            this.code = generateCodeFromName(this.name);
        }
    }
    
    toResponse(entity?: Benefit): IBenefitResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            code: entity.code,
            description: entity.description,
            type: entity.type,
            value: entity.value,
            valueType: entity.valueType,
            frequency: entity.frequency,
            startDate: entity.startDate,
            endDate: entity.endDate,
            sortOrder: entity.sortOrder,
            departmentId: entity.departmentId,
            department: entity.department ? entity.department.toResponse(entity.department) : undefined
        }
    }

    toEntity = (entityRequest: IBenefitRequest, id?: string, contextUser?: ITokenUser): Benefit => {
        this.name = entityRequest.name;
        this.code = entityRequest.code;
        this.description = entityRequest.description;
        this.type = entityRequest.type;
        this.value = entityRequest.value;
        this.valueType = entityRequest.valueType;
        this.frequency = entityRequest.frequency;
        this.startDate = entityRequest.startDate;
        this.endDate = entityRequest.endDate;
        this.sortOrder = entityRequest.sortOrder;
        this.departmentId = entityRequest.departmentId;

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
