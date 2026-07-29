export interface IAttendanceSummaryRequest {
    employeeId: string;
    userId: string;
    departmentId?: string;
    attendanceMonth: number;
    attendanceYear: number;
    status: string;
    monthDays?: number;
    offDays?: number;
    totalWorkingDays?: number;
    presentDays?: number;
    absentDays?: number;
    leaveDays?: number;
    publicHolidays?: number;
    earlyLeaveDays?: number;
    totalWorkingHours?: number;
    totalExpectedWorkingHours?: number;
    totalLockedWorkingHours?: number;
    totalEarlyLeaveHours?: number;
    notes?: string;
}
