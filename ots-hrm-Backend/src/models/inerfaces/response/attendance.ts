import { AttendanceStatus, BreakType, EmployeeStatus } from "../../enums";
import { ICompanyResponseBase } from "./response-base";
import { AbsenceReasonType, PresentStatus } from '../../enums/attendance.enum';
import { User } from '../../../entities/user';
import { IUserResponse } from "./user";
import { IShiftResponse } from "./shift";


export interface IAttendanceResponse extends ICompanyResponseBase {
    userId: string;
    shiftId?: string;
    date: Date;
    checkInTime?: String;
    checkOutTime?: String;
    status: AttendanceStatus;
    presentStatus?: PresentStatus;
    employeeStatus?: EmployeeStatus;
    workingHours?: number;
    lockWorkingHours?: number;
    totalWorkingHours?: number;
    minimumRequiredWorkingHour?: number;
    totalBreakTime?: number;
    lateMinutes?: number;
    earlyLeaveMinutes?: number;
    notes?: string;
    location?: string;
    isRemote: boolean;
    vacationId?: string;
    publicHolidayId?: string;
    remoteWorkId?: string;
    user?: IUserResponse;
    shift?: IShiftResponse;
    // Dynamic absenceReason object based on type
    absenceReason?: AbsenceReasonType;  // Will be Vacation or PublicHoliday based on type
    breaks?: IBreakResponse[];
}


export interface IBreakResponse {
    attendanceId: string;
    userId: string;
    breakType: BreakType;
    startTime: Date;
    endTime?: Date;
    durationMinutes?: number;
    notes?: string;
    location?: string;
    isActive: boolean;
    attendance?: IAttendanceResponse;
    user?: IUserResponse
}

export type BiometricAttendanceStatus = 'OVERTIME' | 'UNDERTIME' | 'ON_TIME' | 'IN_PROGRESS' | 'NO_RECORD' | 'NOT_ENROLLED';

export interface IBiometricSyncResponse {
    employeeId: string;
    employeeName: string;
    date: string;
    checkInTime?: string;   // 24-hour HH:mm:ss, null-ish (undefined) if no record
    checkOutTime?: string;  // undefined if still checked in or no record
    stillCheckedIn: boolean;
    hasRecord: boolean;
    workedMinutes?: number;
    workedHoursLabel?: string; // e.g. "10h 43m"
    standardShiftMinutes: number;
    attendanceStatus: BiometricAttendanceStatus;
    statusMessage: string;
    // Non-blocking: the device's employee_id didn't match what we had on file for this
    // employee (name-matching may have hit a different person). Admin should verify.
    zkDeviceIdWarning?: string;
    // True if this sync actually created/changed the Attendance row (new check-in,
    // new check-out, etc). Used by the automatic sync job to decide whether an
    // employee's update is worth pushing over Socket.IO - absent on responses that
    // never reached a persist (NOT_ENROLLED, NO_RECORD, no check-in yet parsed).
    changed?: boolean;
}

// One employee's outcome within a company-wide bulk sync. `failed` is reserved for
// actual unexpected errors (auth/network/etc.) — a device that simply has no record
// for this employee (NOT_ENROLLED / NO_RECORD) is not a failure, it's a normal result.
export interface IBiometricBulkSyncEmployeeResult {
    employeeId: string;
    // The linked User's id (not employeeId) - needed to route a Socket.IO update to
    // this specific employee's own room (see socket/socket-io.ts's employeeAttendanceRoom).
    userId: string;
    employeeName: string;
    outcome: 'synced' | 'no_record' | 'not_enrolled' | 'failed';
    message: string;
    sync?: IBiometricSyncResponse;
}

export interface IBiometricBulkSyncResponse {
    date: string;
    totalEmployees: number;
    syncedCount: number;
    noRecordCount: number;
    notEnrolledCount: number;
    failedCount: number;
    results: IBiometricBulkSyncEmployeeResult[];
}

export interface IAttendanceStatsResponse {
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalOnLeave: number;
    totalHoliday: number;
    totalDayOff: number;
    totalDefault: number;
    totalRecords: number;
    attendancePercentage: number;
}

export interface IAttendanceStatusResponse extends IAttendanceResponse {
    statusInfo: {
        isWorkingDay: boolean; 
        expectedCheckInTime?: string;
        expectedCheckOutTime?: string;
        canCheckIn: boolean;
        canCheckOut: boolean;
        leaveInfo?: {
            hasLeave: boolean;
            leaveType?: string;
            leaveStatus?: string;
            leaveId?: string;
            startDate?: Date;
            endDate?: Date;
        };
        shiftInfo?: {
            shiftName?: string;
            shiftType?: string;
            workingHours?: number;
            marginTime?: number;
            breakDuration?: number;
        };
        workingDayInfo?: {
            dayName: string;
            dayOfWeek: number;
            isCompanyWorkingDay: boolean;
            isDepartmentWorkingDay: boolean;
            isPublicHoliday?: boolean;
        };
    };
}
