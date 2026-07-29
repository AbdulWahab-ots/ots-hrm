import { ShiftType } from "../../enums";

// Request Interface
export interface IShiftRequest {
    name: string;
    shiftType: ShiftType;
    startTime: string; // Format: "HH:mm:ss" e.g., "09:00:00"
    endTime: string; // Format: "HH:mm:ss" e.g., "17:00:00"
    marginTime?: number; // Margin time in minutes, default 30
    breakDuration?: number; // Break duration in minutes, default 0
    order?: number; // Order/sequence of shift, default 0
    departmentId?: string; // Optional department ID for department-specific shifts
}