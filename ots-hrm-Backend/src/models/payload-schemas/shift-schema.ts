import z from "zod";
import { ShiftType } from "../enums";
import { nonEmptyTrimmedString } from "./general-schema";

// --- Reusable Time Validation ---
const timeValidation = z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: "Time must be in 24-hour format (HH:MM:SS)"
    })
    .refine((time) => {
        const [h, m, s] = time.split(':').map(Number);
        return h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59;
    }, { message: "Invalid time format" });

// --- Time Range Validation Helper ---
function isValidTimeRange(startTime: string, endTime: string): boolean {
    try {
        const today = new Date().toISOString().split('T')[0];
        const start = new Date(`${today}T${startTime}`);
        const end = new Date(`${today}T${endTime}`);
        let diffMinutes;
        if (end <= start) {
            const nextDay = new Date(start);
            nextDay.setDate(nextDay.getDate() + 1);
            nextDay.setHours(end.getHours(), end.getMinutes(), end.getSeconds());
            diffMinutes = (nextDay.getTime() - start.getTime()) / (1000 * 60);
        } else {
            diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        }
        return diffMinutes > 0 && diffMinutes <= 1440;
    } catch {
        return false;
    }
}

// --- Create Shift Schema ---
export const createShiftSchema = z.object({
    name: nonEmptyTrimmedString("Name"),
    shiftType: z
        .string()
        .refine(
            (val) => Object.values(ShiftType).includes(val as ShiftType),
            {
                message: `Invalid shift type. Must be one of: ${Object.values(ShiftType).join(', ')}`,
            }
        ),
    startTime: timeValidation,
    endTime: timeValidation,
    marginTime: z.number().int("Margin time must be an integer").min(0, "Margin time cannot be negative").max(120, "Margin time cannot exceed 2 hours").optional().default(30),
    breakDuration: z.number().int("Break duration must be an integer").min(0, "Break duration cannot be negative").max(120, "Break duration cannot exceed 2 hours").optional().default(0),
    order: z.number().int("Order must be an integer").min(0, "Order cannot be negative").optional().default(0),
    departmentId: z.string().uuid("Department ID must be a valid UUID").optional()
}).refine(
    ({ startTime, endTime }) => isValidTimeRange(startTime, endTime),
    { message: "Invalid time range. Start time must be before end time, and shift duration must be reasonable" }
);

// --- Update Shift Schema ---
export const updateShiftSchema = z.object({
    name: nonEmptyTrimmedString("Name").optional(),
    shiftType: z
        .string()
        .refine(
            (val) => Object.values(ShiftType).includes(val as ShiftType),
            {
                message: `Invalid shift type. Must be one of: ${Object.values(ShiftType).join(', ')}`,
            }
        ).optional(),
    startTime: timeValidation.optional(),
    endTime: timeValidation.optional(),
    marginTime: z.number().int("Margin time must be an integer").min(0, "Margin time cannot be negative").max(120, "Margin time cannot exceed 2 hours").optional(),
    breakDuration: z.number().int("Break duration must be an integer").min(0, "Break duration cannot be negative").max(120, "Break duration cannot exceed 2 hours").optional(),
    order: z.number().int("Order must be an integer").min(0, "Order cannot be negative").optional(),
    departmentId: z.string().uuid("Department ID must be a valid UUID").optional()
}).refine(
    ({ startTime, endTime }) => {
        if (startTime && endTime) return isValidTimeRange(startTime, endTime);
        return true;
    },
    { message: "Invalid time range when both start and end times are provided" }
);
