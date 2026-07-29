import z from "zod";
import { IToDoRequest } from "../inerfaces";

export const todoRequestSchema = z.object(
    {
        todo: z.string(),
        details: z.string(),
        completed: z.boolean(),
        dueDate: z.string(),
        userId: z.string({
            required_error: "User ID is required",
        }).uuid("Invalid UUID format"),
    }
)