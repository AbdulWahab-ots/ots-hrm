import { Column, Entity, JoinColumn, ManyToOne, Index } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { Employee } from "./employee";
import { AdjustmentType, AdjustmentCategory, IPayrollAdjustmentRequest, IPayrollAdjustmentResponse, ITokenUser } from "../models";
import { Payroll } from "./payroll";
import { toCurrencyAmount } from "../utility/number-utility";

@Entity('PayrollAdjustment')
@Index(['companyId', 'payrollId', 'adjustmentType'], { unique: false })
export class PayrollAdjustment extends CompanyEntityBase implements IToResponseBase<PayrollAdjustment, IPayrollAdjustmentResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    payrollId!: string;

    @Column({ type: 'uuid', nullable: false })
    employeeId!: string;

    @Column({ type: 'enum', enum: AdjustmentType, nullable: false })
    adjustmentType!: AdjustmentType;

    @Column({ type: 'enum', enum: AdjustmentCategory, nullable: false })
    category!: AdjustmentCategory;

    @Column({ type: 'varchar', length: 100, nullable: false })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    // Stored as whole rupees (PKR)
    @Column({ 
        type: 'bigint', 
        nullable: false,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    amount!: number;

    @Column({ type: 'boolean', default: true, nullable: false })
    manual!: boolean;

    // Relations
    @ManyToOne(() => Payroll, { nullable: false, eager: false })
    @JoinColumn({ name: 'payrollId', referencedColumnName: 'id' })
    payroll!: Payroll;

    @ManyToOne(() => Employee, { nullable: false, eager: false })
    @JoinColumn({ name: 'employeeId', referencedColumnName: 'id' })
    employee!: Employee;

    // Methods
    toResponse(entity?: PayrollAdjustment): IPayrollAdjustmentResponse {
        const adjustment = entity || this;
        return {
            id: adjustment.id,
            companyId: adjustment.companyId,
            payrollId: adjustment.payrollId,
            employeeId: adjustment.employeeId,
            adjustmentType: adjustment.adjustmentType,
            category: adjustment.category,
            title: adjustment.title,
            description: adjustment.description,
            amount: adjustment.amount,
            manual: adjustment.manual,
            createdAt: adjustment.createdAt,
            active: adjustment.active,
            createdBy: adjustment.createdBy,
            createdById: adjustment.createdBy,
            // Relations
            payroll: adjustment.payroll ? {
                id: adjustment.payroll.id,
                payrollMonth: adjustment.payroll.payrollMonth,
                payrollYear: adjustment.payroll.payrollYear,
                status: adjustment.payroll.status
            } : undefined,
            employee: adjustment.employee ? {
                id: adjustment.employee.id,
                employeeCode: adjustment.employee.employeeCode,
                user: adjustment.employee.user ? {
                    id: adjustment.employee.user.id,
                    firstName: adjustment.employee.user.firstName,
                    lastName: adjustment.employee.user.lastName,
                    email: adjustment.employee.user.email
                } : undefined
            } : undefined
        };
    }

    toEntity = (requestEntity: IPayrollAdjustmentRequest, id?: string, contextUser?: ITokenUser): PayrollAdjustment => {
        this.payrollId = requestEntity.payrollId;
        this.employeeId = requestEntity.employeeId;
        this.adjustmentType = requestEntity.adjustmentType;
        this.category = requestEntity.category;
        this.title = requestEntity.title;
        this.description = requestEntity.description;
        
        // Use utility function to ensure proper number conversion and remove decimal parts
        this.amount = toCurrencyAmount(requestEntity.amount, 0);
        
        // Set manual attribute - default to true if not provided
        this.manual = requestEntity.manual !== undefined ? requestEntity.manual : true;

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Business Logic Methods
    isAddition(): boolean {
        return this.adjustmentType === AdjustmentType.ADDITION;
    }

    isDeduction(): boolean {
        return this.adjustmentType === AdjustmentType.DEDUCTION;
    }

    getCategoryDisplayName(): string {
        return this.category.replace('_', ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }
} 