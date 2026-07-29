export interface IEmployeeBenefitRequest {
    userId: string;
    employeeId: string;
    benefitId: string;
    effectiveDate?: Date;
    endDate?: Date;
    customValue?: number;
    notes?: string;
} 