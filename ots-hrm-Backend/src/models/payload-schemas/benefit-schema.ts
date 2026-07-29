import z from "zod";
import { nonEmptyTrimmedString } from "./general-schema";
import { BenefitType, BenefitValueType, BenefitFrequency } from "../enums";

export const createBenefitSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    description: z.string().optional(),
    type: z.string()
        .refine(
            (val) => Object.values(BenefitType).includes(val as BenefitType),
            {
                message: `Invalid type. Must be one of: ${Object.values(BenefitType).join(', ')}`,
            }
        ).optional(),
    value: z.number().optional(),
    valueType: z.
        string()
        .refine(
            (val) => Object.values(BenefitValueType).includes(val as BenefitValueType)
            , {
                message: `Invalid value type. Must be one of: ${Object.values(BenefitValueType).join(', ')}`,
            }).optional(),

    frequency: z.
        string()
        .refine(
            (val) => Object.values(BenefitFrequency).includes(val as BenefitFrequency)
            , {
                message: `Invalid frequency. Must be one of: ${Object.values(BenefitFrequency).join(', ')}`,
            }).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortOrder: z.number().optional(),
    departmentId: z.string().uuid().optional()
});

export const updateBenefitSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    description: z.string().optional(),
    type: z.
        string()
        .refine(
            (val) => Object.values(BenefitType).includes(val as BenefitType),
            {
                message: `Invalid type. Must be one of: ${Object.values(BenefitType).join(', ')}`,
            }
        ).optional(),
    value: z.number().optional(),
    valueType: z.
        string()
        .refine(
            (val) => Object.values(BenefitValueType).includes(val as BenefitValueType)
            , {
                message: `Invalid value type. Must be one of: ${Object.values(BenefitValueType).join(', ')}`,
            }).optional(),

    frequency: z.
        string()
        .refine(
            (val) => Object.values(BenefitFrequency).includes(val as BenefitFrequency)
            , {
                message: `Invalid frequency. Must be one of: ${Object.values(BenefitFrequency).join(', ')}`,
            }).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortOrder: z.number().optional(),
    departmentId: z.string().uuid().optional()
});

export const benefitSchemas = {
    create: createBenefitSchema,
    update: updateBenefitSchema
};
