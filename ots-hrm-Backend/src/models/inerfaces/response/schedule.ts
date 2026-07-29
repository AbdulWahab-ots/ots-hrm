import { ScheduleType, WorkType } from "../../enums";
import { ICompanyResponseBase } from "./response-base";

// Response Interface
export interface ISchedulerResponse extends ICompanyResponseBase {
    userId: string;
    scheduleDate: Date;
    startTime: string;
    endTime: string;
    scheduleType: ScheduleType;
    workType?: WorkType; // Default 'onsite'
    reason?: string;
    notes?: string;
    isPaidOvertime: boolean;
    user: any; // User response object
}