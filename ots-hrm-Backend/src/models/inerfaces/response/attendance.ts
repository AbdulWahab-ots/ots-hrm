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
