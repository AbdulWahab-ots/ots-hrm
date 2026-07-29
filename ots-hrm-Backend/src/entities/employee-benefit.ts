import { Column, Entity, JoinColumn, ManyToOne, Unique, BeforeInsert } from "typeorm";
import { IEmployeeBenefitRequest, IEmployeeBenefitResponse, ITokenUser, EmployeeBenefitStatus } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Benefit } from "./benefit";
import { User } from "./user";
import { Employee } from "./employee";

@Entity('EmployeeBenefit')
@Unique(['companyId', 'employeeId', 'benefitId']) // One employee can have one instance of each benefit
export class EmployeeBenefit extends CompanyEntityBase implements IToResponseBase<EmployeeBenefit, IEmployeeBenefitResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'uuid', nullable: false })
    employeeId!: string;

    @Column({ type: 'uuid', nullable: false })
    benefitId!: string;

    @Column({ type: 'date', nullable: false })
    effectiveDate!: Date;

    @Column({ type: 'date', nullable: true })
    endDate?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    customValue?: number; // Override benefit value if needed

    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Relations
    @ManyToOne(() => User, { 
        nullable: false,
        eager: false
    })
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User;

    @ManyToOne(() => Employee, { 
        nullable: false,
        eager: false
    })
    @JoinColumn({ name: 'employeeId', referencedColumnName: 'id' })
    employee!: Employee;

    @ManyToOne(() => Benefit, { 
        nullable: false,
        eager: false
    })
    @JoinColumn({ name: 'benefitId', referencedColumnName: 'id' })
    benefit!: Benefit;

    @BeforeInsert()
    beforeInsert() {
        if (!this.effectiveDate) {
            this.effectiveDate = new Date();
        }
    }

    toResponse(entity?: EmployeeBenefit): IEmployeeBenefitResponse {
        if (!entity) entity = this;
        
        return {
            ...super.toCompanyResponseBase(entity),
            userId: entity.userId,
            employeeId: entity.employeeId,
            benefitId: entity.benefitId,
            effectiveDate: entity.effectiveDate,
            endDate: entity.endDate,
            customValue: entity.customValue,
            notes: entity.notes,
            user: entity.user ? entity.user.toResponse() : undefined,
            employee: entity.employee ? entity.employee.toResponse() : undefined,
            benefit: entity.benefit ? entity.benefit.toResponse() : undefined,
        };
    }

    toEntity(requestEntity: IEmployeeBenefitRequest, id?: string, contextUser?: ITokenUser): EmployeeBenefit {
        this.userId = requestEntity.userId;
        this.employeeId = requestEntity.employeeId;
        this.benefitId = requestEntity.benefitId;
        this.effectiveDate = requestEntity.effectiveDate ?? new Date();
        this.endDate = requestEntity.endDate;
        this.customValue = requestEntity.customValue;
        this.notes = requestEntity.notes;
        
        if (contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Helper Methods
    isActive(): boolean {
        return this.active === true;
    }

    isEffective(asOf?: Date): boolean {
        // TypeORM returns `date` columns as strings ("YYYY-MM-DD"), not Date objects.
        // Coerce to Date before comparing to avoid NaN comparisons.
        const ref = asOf ?? new Date();
        const effective = new Date(this.effectiveDate);
        const end = this.endDate ? new Date(this.endDate) : null;
        return effective <= ref && (!end || end >= ref);
    }

    // Get the actual value (custom or from benefit)
    getActualValue(): number | undefined {
        return this.customValue ?? this.benefit?.value;
    }
} 