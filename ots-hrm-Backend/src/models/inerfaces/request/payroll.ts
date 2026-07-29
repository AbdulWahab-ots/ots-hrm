import { PayrollStatus, AdjustmentType, AdjustmentCategory } from '../../enums';

export interface IPayrollRequest {
    employeeId: string;
    userId: string;
    departmentId?: string;
    payrollMonth: number;
    payrollYear: number;
    status?: PayrollStatus;
    basicSalary: number;
    grossSalary?: number;
    netSalary?: number;

    incomeTax?: number;
    totalAdditions?: number;
    totalDeductions?: number;
    notes?: string;
}

export interface IPayrollAdjustmentRequest {
    payrollId: string;
    employeeId: string;
    adjustmentType: AdjustmentType;
    category: AdjustmentCategory;
    title: string;
    description?: string;
    amount: number;
    manual?: boolean;
}

export interface IManualAdjustmentRequest {
    adjustments: Array<{
        employeeId: string;
        adjustmentType: AdjustmentType;
        category: AdjustmentCategory;
        title: string;
        description?: string;
        amount: number;
        manual?: boolean;
    }>;
}

export interface ISalarySlipGenerationRequest {
    departmentIds: string[];
    payrollMonth: number;
    payrollYear: number;
    notes?: string;
}

export interface IPayrollApprovalRequest {
    payrollId: string;
    status: PayrollStatus;
    notes?: string;
}