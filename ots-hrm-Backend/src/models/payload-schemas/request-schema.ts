import { z } from 'zod';
import { AttendanceRequestType, AttendanceRequestStatus } from '../enums';

// Schema for creating a new attendance request
export const requestCreateSchema = z.object({
    code: z.string().optional(), // Auto-generated, not required in input
    userId: z.string().uuid('Invalid user ID format').optional(), // Optional, will default to current user
    attendanceId: z.string().uuid('Invalid attendance ID format').optional(), // Auto-generated if needed
    type: z.enum([AttendanceRequestType.CHECK_IN, AttendanceRequestType.CHECK_OUT], {
        errorMap: () => ({ message: 'Type must be either CHECK_IN or CHECK_OUT' })
    }),
    date: z.coerce.date({
        errorMap: () => ({ message: 'Date must be a valid date' })
    }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'Time must be in HH:MM:SS format'
    }),
    reason: z.string().min(10, 'Reason must be at least 10 characters long').max(500, 'Reason cannot exceed 500 characters'),
    status: z.enum([AttendanceRequestStatus.PENDING, AttendanceRequestStatus.APPROVED, AttendanceRequestStatus.REJECTED]).optional()
});

// Schema for updating an attendance request
export const requestUpdateSchema = z.object({
    code: z.string().optional(),
    userId: z.string().uuid('Invalid user ID format').optional(),
    attendanceId: z.string().uuid('Invalid attendance ID format').optional(),
    type: z.enum([AttendanceRequestType.CHECK_IN, AttendanceRequestType.CHECK_OUT], {
        errorMap: () => ({ message: 'Type must be either CHECK_IN or CHECK_OUT' })
    }).optional(),
    date: z.coerce.date({
        errorMap: () => ({ message: 'Date must be a valid date' })
    }).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'Time must be in HH:MM:SS format'
    }).optional(),
    reason: z.string().min(10, 'Reason must be at least 10 characters long').max(500, 'Reason cannot exceed 500 characters').optional(),
    status: z.enum([AttendanceRequestStatus.PENDING, AttendanceRequestStatus.APPROVED, AttendanceRequestStatus.REJECTED]).optional()
});

// Schema for reviewing a request (approve/reject)
export const requestReviewSchema = z.object({
    reviewNotes: z.string().max(1000, 'Review notes cannot exceed 1000 characters').optional()
});

export type RequestCreateType = z.infer<typeof requestCreateSchema>;
export type RequestUpdateType = z.infer<typeof requestUpdateSchema>;
export type RequestReviewType = z.infer<typeof requestReviewSchema>;
