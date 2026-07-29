import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Index, BeforeInsert } from "typeorm";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { Employee } from "./employee";
import { User } from "./user";
import { Department } from "./department";
import { PayrollStatus, IPayrollRequest, IPayrollResponse, ITokenUser } from "../models";
import { PayrollAdjustment } from "./payroll-adjustment";
import { toCurrencyAmount, toInteger } from "../utility/number-utility";

@Entity('Payroll')
@Index(['companyId', 'employeeId', 'payrollMonth', 'payrollYear'], { unique: true })
export class Payroll extends CompanyEntityBase implements IToResponseBase<Payroll, IPayrollResponse> {
    
    @Column({ type: 'uuid', nullable: false })
    employeeId!: string;

    @Column({ type: 'uuid', nullable: false })
    userId!: string;

    @Column({ type: 'uuid', nullable: true })
    departmentId?: string;

    @Column({ type: 'int', nullable: false })
    payrollMonth!: number; // 1-12

    @Column({ type: 'int', nullable: false })
    payrollYear!: number;

    @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT, nullable: false })
    status!: PayrollStatus;

    // Basic Salary Components - stored as whole rupees (PKR)
    @Column({ 
        type: 'bigint', 
        nullable: false,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    basicSalary!: number;

    @Column({ 
        type: 'bigint', 
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    grossSalary!: number;

    @Column({ 
        type: 'bigint', 
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    netSalary!: number;



    // Tax - Changed to bigint for currency amounts
    @Column({ 
        type: 'bigint', 
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    incomeTax!: number;

    // Additions - Changed to bigint for currency amounts
    @Column({ 
        type: 'bigint', 
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    totalAdditions!: number;

    // Deductions - Changed to bigint for currency amounts
    @Column({ 
        type: 'bigint', 
        default: 0,
        transformer: {
            to: (value: number) => value,
            from: (value: string | number) => typeof value === 'string' ? parseInt(value, 10) : value
        }
    })
    totalDeductions!: number;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    approvedBy?: string;

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

    @ManyToOne(() => User, { nullable: true, eager: false })
    @JoinColumn({ name: 'approvedBy', referencedColumnName: 'id' })
    approver?: User;

    @OneToMany(() => PayrollAdjustment, adjustment => adjustment.payroll, {
        cascade: false,
        eager: false
    })
    adjustments?: PayrollAdjustment[];

    // Methods
    toResponse(entity?: Payroll): IPayrollResponse {
        const payroll = entity || this;
        return {
            id: payroll.id,
            companyId: payroll.companyId,
            employeeId: payroll.employeeId,
            userId: payroll.userId,
            departmentId: payroll.departmentId,
            payrollMonth: payroll.payrollMonth,
            payrollYear: payroll.payrollYear,
            status: payroll.status,
            basicSalary: payroll.basicSalary,
            grossSalary: payroll.grossSalary,
            netSalary: payroll.netSalary,

            incomeTax: payroll.incomeTax,
            totalAdditions: payroll.totalAdditions,
            totalDeductions: payroll.totalDeductions,
            approvedAt: payroll.approvedAt,
            approvedBy: payroll.approvedBy,
            notes: payroll.notes,
            createdAt: payroll.createdAt,
            active: payroll.active,
            createdBy: payroll.createdBy,
            createdById: payroll.createdBy,
            // Relations
            employee: payroll.employee ? {
                id: payroll.employee.id,
                employeeCode: payroll.employee.employeeCode,
                user: payroll.employee.user ? {
                    id: payroll.employee.user.id,
                    firstName: payroll.employee.user.firstName,
                    lastName: payroll.employee.user.lastName,
                    email: payroll.employee.user.email
                } : undefined
            } : undefined,
            user: payroll.user ? {
                id: payroll.user.id,
                firstName: payroll.user.firstName,
                lastName: payroll.user.lastName,
                email: payroll.user.email
            } : undefined,
            department: payroll.department ? {
                id: payroll.department.id,
                name: payroll.department.name
            } : undefined,
            approver: payroll.approver ? {
                id: payroll.approver.id,
                firstName: payroll.approver.firstName,
                lastName: payroll.approver.lastName,
                email: payroll.approver.email
            } : undefined,
            adjustments: payroll.adjustments?.map(adj => adj.toResponse())
        };
    }

    toEntity = (requestEntity: IPayrollRequest, id?: string, contextUser?: ITokenUser): Payroll => {
        this.employeeId = requestEntity.employeeId;
        this.userId = requestEntity.userId;
        this.departmentId = requestEntity.departmentId;
        this.payrollMonth = requestEntity.payrollMonth;
        this.payrollYear = requestEntity.payrollYear;
        this.status = requestEntity.status || PayrollStatus.DRAFT;
        
        // Use utility functions to ensure proper number conversion and remove decimal parts
        this.basicSalary = toCurrencyAmount(requestEntity.basicSalary, 0);
        this.grossSalary = toCurrencyAmount(requestEntity.grossSalary, 0);
        this.netSalary = toCurrencyAmount(requestEntity.netSalary, 0);

        this.incomeTax = toCurrencyAmount(requestEntity.incomeTax, 0);
        this.totalAdditions = toCurrencyAmount(requestEntity.totalAdditions, 0);
        this.totalDeductions = toCurrencyAmount(requestEntity.totalDeductions, 0);
        
        this.notes = requestEntity.notes;

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }

    // Business Logic Methods
    isDraft(): boolean {
        return this.status === PayrollStatus.DRAFT;
    }

    isPending(): boolean {
        return this.status === PayrollStatus.PENDING;
    }

    isApproved(): boolean {
        return this.status === PayrollStatus.APPROVED;
    }

    isPaid(): boolean {
        return this.status === PayrollStatus.PAID;
    }

    canBeApproved(): boolean {
        return this.status === PayrollStatus.PENDING;
    }

    canBePaid(): boolean {
        return this.status === PayrollStatus.APPROVED;
    }

    calculateNetSalary(): number {
        return this.grossSalary + this.totalAdditions - this.totalDeductions - this.incomeTax;
    }



    getPayrollPeriod(): string {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[this.payrollMonth - 1]} ${this.payrollYear}`;
    }
} 