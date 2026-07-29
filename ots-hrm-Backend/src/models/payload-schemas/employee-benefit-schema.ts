import z from "zod";

// Schema for a single employee benefit
export const employeeBenefitSchema = z.object({
    benefitId: z.string().uuid("Benefit ID must be a valid UUID"),
    effectiveDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    customValue: z.number().optional(),
    notes: z.string().optional()
});

// Schema for multiple of employee benefits
export const multipleEmployeeBenefitsSchema = z.array(employeeBenefitSchema)
    .optional()
    .default([]);


export const employeeBenefitSchemas = {
    single: employeeBenefitSchema,
    array: multipleEmployeeBenefitsSchema
}; 