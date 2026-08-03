import { AbsenceReasonType, AttendanceStatus, BreakType, PresentStatus,  } from "../../enums";


export interface IAttendanceRequest {
    userId: string;
    shiftId?: string;
    date: Date;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    presentStatus?: PresentStatus;
    workingHours?: number;
    totalWorkingHours?: number;
    minimumRequiredWorkingHour?: number;
    earlyLeaveMinutes?: number;
    lateMinutes?: number;
    notes?: string;
    location?: string;
    isRemote?: boolean;
    absenceReasonType?: AbsenceReasonType;  
    // Explicit fields for better type safety
    vacationId?: string;
    publicHolidayId?: string;
    remoteWorkId?: string;
}

export interface ICheckInRequest {
    date: Date;
    checkInTime: string;
}

export interface ICheckOutRequest {
    date: Date;
    checkOutTime: string;
}

export interface IStatusRequest {
    date: Date;
}

// employeeId omitted -> resolves to the requesting user's own employee record
// (used by the employee's own dashboard); admins pass it explicitly to refresh
// any employee under their company.
export interface IBiometricSyncRequest {
    employeeId?: string;
    date?: string;
}

// Admin-only: sync every active employee in the company for one date (default: today).
export interface IBiometricBulkSyncRequest {
    date?: string;
}




export interface IBreakRequest {
    attendanceId: string;
    userId: string;
    breakType: BreakType;
    startTime: Date;
    endTime?: Date;
    notes?: string;
    location?: string;
}

export interface IStartBreakRequest {
    attendanceId: string;
    breakType: BreakType;
    notes?: string;
}

export interface IEndBreakRequest {
    breakId: string;
}