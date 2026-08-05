import { IResponseBase } from './response-base';
import { PayrollStatus, AdjustmentType, AdjustmentCategory } from '../../enums';

export interface IPayrollResponse extends IResponseBase {
    companyId: string;
    employeeId: string;
    userId: string;
    departmentId?: string;
    payrollMonth: number;
    payrollYear: number;
    status: PayrollStatus;
    basicSalary: number;
    grossSalary: number;
    netSalary: number;

    incomeTax: number;
    totalAdditions: number;
    totalDeductions: number;
    approvedAt?: Date;
    approvedBy?: string;
    notes?: string;
    // Relations
    employee?: {
        id: string;
        employeeCode: string;
        designation?: {
            id: string;
            title: string;
        };
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    department?: {
        id: string;
        name: string;
    };
    approver?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    adjustments?: IPayrollAdjustmentResponse[];
}

export interface IPayrollAdjustmentResponse extends IResponseBase {
    companyId: string;
    payrollId: string;
    employeeId: string;
    adjustmentType: AdjustmentType;
    category: AdjustmentCategory;
    title: string;
    description?: string;
    amount: number;
    manual: boolean;
    // Relations
    payroll?: {
        id: string;
        payrollMonth: number;
        payrollYear: number;
        status: PayrollStatus;
    };
    employee?: {
        id: string;
        employeeCode: string;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    };
}

export interface IManualAdjustmentResponse {
    success: boolean;
    message: string;
    adjustmentsCreated: number;
    totalAdditions: number;
    totalDeductions: number;
    adjustments: IPayrollAdjustmentResponse[];
    errors?: string[];
}

export interface ISalarySlipGenerationResponse {
    success: boolean;
    message: string;
    generatedPayrolls: number;
    totalEmployees: number;
    totalAmount: number;
    payrolls: IPayrollResponse[];
    errors?: string[];
} 