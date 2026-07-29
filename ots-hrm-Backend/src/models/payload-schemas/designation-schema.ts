import z from "zod";
import { nonEmptyTrimmedString } from "./general-schema";

export const createDesignationSchema = z.object(
    {
        title: nonEmptyTrimmedString("Title"),
        active: z.boolean().optional(),
        departmentId: z.string()
            .uuid("Invalid departmentId: must be a valid UUID")
            .optional(),
        description: z.string().optional(),
    }
);

export const updateDesignationSchema = z.object(
    {
        title: nonEmptyTrimmedString("Title").optional(),
        active: z.boolean().optional(),
        departmentId: z.string()
            .uuid("Invalid departmentId: must be a valid UUID")
            .optional(),
        description: z.string().optional(),
    }
);
