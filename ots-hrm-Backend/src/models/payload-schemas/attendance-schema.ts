import { z } from 'zod';

// Date string: YYYY-MM-DD
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Time string: HH:mm:ss (24-hour)
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, "Time must be in HH:mm:ss 24-hour format");

// Check-in schema
export const checkInSchema = z.object({
    date: dateString, // Accepts date as string
    checkInTime: timeString, // Accepts time as string in 24-hour format
});

// Check-out schema
export const checkOutSchema = z.object({
    date: dateString, // Accepts date as string
    checkOutTime: timeString, // Accepts time as string in 24-hour format
});

// Status schema
export const statusSchema = z.object({
    date: dateString, // Accepts date as string
});

// Start break schema
export const startBreakSchema = z.object({
    attendanceId: z.string().uuid("attendanceId must be a valid UUID"),
    breakType: z.enum(['LunchBreak', 'TeaBreak', 'MeetingBreak', 'PrayerBreak', 'PersonalBreak', 'SmokingBreak', 'Other']),
    notes: z.string().optional(),
});

// End break schema
export const endBreakSchema = z.object({
    breakId: z.string().uuid("breakId must be a valid UUID"),
});

// Biometric attendance sync schema — employeeId omitted resolves to the caller's own
// employee record; date omitted defaults to today (resolved by the external API).
export const biometricSyncSchema = z.object({
    employeeId: z.string().uuid("employeeId must be a valid UUID").optional(),
    date: dateString.optional(),
});
