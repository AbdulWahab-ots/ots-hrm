import { ICompanyResponseBase } from "./response-base";

export interface IAttendanceSummaryResponse extends ICompanyResponseBase {
    employeeId: string;
    userId: string;
    departmentId?: string;
    attendanceMonth: number;
    attendanceYear: number;
    status: string;
    monthDays: number;
    offDays: number;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    publicHolidays: number;
    earlyLeaveDays: number;
    totalWorkingHours: number;
    totalExpectedWorkingHours: number;
    totalLockedWorkingHours: number;
    totalEarlyLeaveHours: number;
    notes?: string;
    // Relations
    employee?: {
        id: string;
        employeeCode: string;
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
    };
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    department?: {
        id: string;
        name: string;
    };
}
