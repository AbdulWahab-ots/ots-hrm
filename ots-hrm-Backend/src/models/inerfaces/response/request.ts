import { ICompanyResponseBase } from './response-base';
import { IUserResponse } from './user';
import { IAttendanceResponse } from './attendance';
import { AttendanceRequestStatus, AttendanceRequestType } from '../../enums';

export interface IRequestResponse extends ICompanyResponseBase {
    code: string;
    userId: string;
    user?: IUserResponse;
    attendanceId: string;
    attendance?: IAttendanceResponse;
    type: AttendanceRequestType;
    date: Date;
    time: string;
    reason: string;
    status: AttendanceRequestStatus;
    reviewedBy?: string;
    reviewedByUser?: IUserResponse;
    reviewedAt?: Date;
    reviewNotes?: string;
    }
