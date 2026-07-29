import {  AttendanceRequestStatus, AttendanceRequestType } from '../../enums';

export interface IRequestRequest {
    code?: string; // Optional for creation, will be auto-generated
    userId: string;
    attendanceId?: string; // Optional for creation, will be auto-generated if needed
    type: AttendanceRequestType;
    date: Date;
    time: string;
    reason: string;
    status?: AttendanceRequestStatus;
}
