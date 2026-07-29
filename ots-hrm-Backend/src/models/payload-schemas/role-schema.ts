import z from "zod";

export const createRRoleSchema = z.object(
    {
        name: z.string(),
        active: z.boolean().optional(),
    }
);

export const updateRoleSchema = z.object(
    {
        name: z.string(),
        active: z.boolean().optional(), 
    }
);
