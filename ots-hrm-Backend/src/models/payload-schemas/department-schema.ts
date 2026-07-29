import z from "zod";
import { workingDaysSchemas } from "./working-days-schema";
import { nonEmptyTrimmedString } from "./general-schema";


export const createDepartmentSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    active: z.boolean().optional(),
    description: z.string().optional(),
    workingDays: workingDaysSchemas.create.optional()
});

export const updateDepartmentSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    active: z.boolean().optional(),
    description: z.string().optional(),
    workingDays: workingDaysSchemas.update.optional()
});
