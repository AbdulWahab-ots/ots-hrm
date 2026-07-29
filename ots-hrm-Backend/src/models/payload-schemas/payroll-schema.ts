import z from "zod";
import { PayrollStatus, AdjustmentType, AdjustmentCategory } from '../enums';

export const salarySlipGenerationSchema = z.object({
    departmentIds: z.array(z.string().uuid()).min(1, 'At least one department ID is required'),
    payrollMonth: z.number().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
    payrollYear: z.number().min(2020, 'Year must be between 2020 and 2030').max(2030, 'Year must be between 2020 and 2030'),
    notes: z.string().optional()
});

export const manualAdjustmentSchema = z.object({
    adjustments: z.array(z.object({
        employeeId: z.string().uuid('Invalid employee ID format'),
        adjustmentType: z.nativeEnum(AdjustmentType),
        category: z.nativeEnum(AdjustmentCategory),
        title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
        description: z.string().optional(),
        amount: z.number().positive('Amount must be greater than 0'),
        manual: z.boolean().optional()
    })).min(1, 'At least one adjustment is required')
});

// UUID parameter validation (for path params)
export const payrollUuidParamSchema = z.object({
    payrollId: z.string({
        required_error: "ID is required",
    }).uuid("ID must be a valid UUID")
});
// UUID parameter validation (for path params)
export const adjustmentUuidParamSchema = z.object({
    adjustmentId: z.string({
        required_error: "ID is required",
    }).uuid("ID must be a valid UUID")
});

export const payrollApprovalSchema = z.object({
    payrollId: z.string().uuid('Invalid payroll ID format'),
    status: z.string().refine(
        (val) => Object.values(PayrollStatus).includes(val as PayrollStatus),
        {
            message: `Invalid status. Must be one of: ${Object.values(PayrollStatus).join(', ')}`,
        }
    ),
    notes: z.string().optional()
});

