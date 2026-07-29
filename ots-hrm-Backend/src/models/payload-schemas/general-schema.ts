import z from "zod";


// UUID parameter validation (for path params)
export const uuidParamSchema = z.object({
    id: z.string({
        required_error: "ID is required",
    }).uuid("ID must be a valid UUID")
});

export const nonEmptyTrimmedString = (fieldName: string) =>
    z.string()
        .trim()
        .min(1, { message: `${fieldName} cannot be empty or just spaces` })
        .max(255, { message: `${fieldName} must be less than 255 characters` });
