import { DayName } from "../../enums";

// Single working day request (for internal use)
export interface IWorkingDayRequest {
    dayName: DayName;
    isWorkingDay?: boolean;
    notes?: string;
}

// Bulk working days request (for API endpoints)
export interface IWorkingDaysRequest {
    departmentId?: string; // Optional - null means company-wide
    workingDays: IWorkingDayRequest[]; // Array of working days
}

// Legacy interface for backward compatibility
export interface IWorkingDaysRequestSingle {
    dayName: DayName; // Use enum for day names
    isWorkingDay?: boolean; // Optional with default true
    notes?: string; // Optional notes
    dayOfWeek?: number; // Optional day of the week
    // NEW: Department support
    departmentId?: string; // Optional department ID - when null, applies company-wide
}