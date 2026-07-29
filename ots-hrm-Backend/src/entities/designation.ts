import { Column, Entity, JoinColumn, ManyToOne, Index, BeforeInsert, BeforeUpdate } from "typeorm";
import { IDesignationRequest, IDesignationResponse, ITokenUser, LevelHierarchy } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Department } from "./department";
import { generateCodeFromName, sanitizeString } from "../utility";

@Entity('Designation')
// Partial unique indexes: only enforced among non-deleted rows, so a soft-deleted
// designation's code/title doesn't block creating a new one with the same value.
@Index(['companyId', 'code'], { unique: true, where: '"deleted" = false' }) // Ensure unique code per company
@Index(['companyId', 'title'], { unique: true, where: '"deleted" = false' }) // Ensure unique title per company
export class Designation extends CompanyEntityBase implements IToResponseBase<Designation, IDesignationResponse> {
    
    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code?: string;

    @Column({ type: 'text', nullable: true })
    jobDescription?: string;

    @Column({ 
        type: 'enum', 
        enum: LevelHierarchy, 
        default: LevelHierarchy.ENTRY 
    })
    levelHierarchy!: LevelHierarchy;

    @Column({ type: 'text', nullable: true })
    responsibilities?: string;

    @Column({ type: 'int', nullable: true })
    sortOrder?: number;

    // Relationship with Department - CASCADE on delete
    @ManyToOne(() => Department, { 
        nullable: true, 
        eager: false,
        onDelete: 'CASCADE' // This will delete the designation when department is deleted
    })
    @JoinColumn({ name: 'departmentId', referencedColumnName: 'id' })
    department?: Department;

    @BeforeInsert()
    beforeInsert() {
        // Generate code if not provided
        if (!this.code && this.title) {
            this.title = sanitizeString(this.title);
            this.code = generateCodeFromName(this.title);
        }
    }
    
    toResponse(entity?: Designation): IDesignationResponse {
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            departmentId: entity.departmentId,
            title: entity.title,
            code: entity.code,
            jobDescription: entity.jobDescription,
            levelHierarchy: entity.levelHierarchy,
            responsibilities: entity.responsibilities,
            sortOrder: entity.sortOrder,
            department: entity.department ? entity.department.toResponse(entity.department) : undefined
        }
    }

    toEntity = (entityRequest: IDesignationRequest, id?: string, contextUser?: ITokenUser): Designation => {
        this.departmentId = entityRequest.departmentId;
        this.title = entityRequest.title;
        this.code = entityRequest.code;
        this.jobDescription = entityRequest.jobDescription;
        this.levelHierarchy = entityRequest.levelHierarchy && typeof entityRequest.levelHierarchy === "string"
            ? (LevelHierarchy[entityRequest.levelHierarchy.toUpperCase() as keyof typeof LevelHierarchy] ?? LevelHierarchy.ENTRY)
            : (entityRequest.levelHierarchy || LevelHierarchy.ENTRY);
        this.responsibilities = entityRequest.responsibilities;
        this.sortOrder = entityRequest.sortOrder;

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