import z from "zod";
import { DayName } from "../enums"; // Adjust import path as needed

// Single working day schema
const workingDaySchema = z.object({
    dayName: z.
        string()
        .refine(
            (val) => Object.values(DayName).includes(val as DayName),
            {
                message: `Invalid day name. Must be one of: ${Object.values(DayName).join(', ')}`,
            }
        ),
    isWorkingDay: z.boolean().optional().default(true),
    notes: z.string().optional()
});

const GeneralCreateWorkingDaySchema = z.array(workingDaySchema)
    .length(7, "All 7 days must be provided for creation")
    .refine(
        (workingDays) => {
            const dayNames = workingDays.map(wd => wd.dayName);
            const uniqueDays = new Set(dayNames);
            return uniqueDays.size === 7;
        },
        {
            message: "All 7 days must be unique"
        }
    )

const GeneralUpdateWorkingDaySchema = z.array(workingDaySchema)
    .min(1, "At least one working day must be provided for update")
    .refine(
        (workingDays) => {
            const dayNames = workingDays.map(wd => wd.dayName);
            const uniqueDays = new Set(dayNames);
            return uniqueDays.size === dayNames.length;
        },
        {
            message: "All working days must have unique day names"
        }
    );

// Bulk working days schema for creation (all 7 days required)
export const createWorkingDaysSchema = z.object({
    departmentId: z.string().uuid().optional(),
    workingDays: GeneralCreateWorkingDaySchema
});

// Bulk working days schema for update (1 or more days)
export const updateWorkingDaysSchema = z.object({
    departmentId: z.string().uuid().optional(),
    workingDays: GeneralUpdateWorkingDaySchema
}); 

// Export schemas for use in services
export const workingDaysSchemas = {
    create: GeneralCreateWorkingDaySchema,
    update: GeneralUpdateWorkingDaySchema
};

// Legacy single working day schemas (for backward compatibility)
export const createSingleWorkingDaySchema = workingDaySchema;
export const updateSingleWorkingDaySchema = z.object({
    dayName: z.
        string()
        .refine(
            (val) => Object.values(DayName).includes(val as DayName),
            {
                message: `Invalid day name. Must be one of: ${Object.values(DayName).join(', ')}`,
            }
        ),
    isWorkingDay: z.boolean().optional(),
    notes: z.string().optional()
});


// UUID parameter validation (for path params)
export const uuidDepartmentParamSchema = z.object({
    departmentId: z.string({
        required_error: "Department ID is required",
    }).uuid("Department ID must be a valid UUID")
});