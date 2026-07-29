import { ScheduleType, WorkType } from "../../enums";

// Request Interface
export interface ISchedulerRequest {
    userId: string;
    scheduleDate: Date;
    startTime: string; // Format: "HH:mm:ss"
    endTime: string; // Format: "HH:mm:ss"
    scheduleType?: ScheduleType; // Default 'custom'
    workType?: WorkType; // Default 'onsite'
    reason?: string; // Why schedule was modified
    notes?: string;
    isPaidOvertime?: boolean; // Default true
}