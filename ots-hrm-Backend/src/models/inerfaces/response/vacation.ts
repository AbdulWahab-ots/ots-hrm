import { VacationProgressStatus, VacationStatus, RequestType } from "../../enums";
import { ICompanyResponseBase } from "./response-base";


// ========================= VACATION RESPONSE INTERFACE =========================
export interface IVacationResponse extends ICompanyResponseBase {
    requestedBy: string;
    fromDate: Date;
    toDate: Date;
    totalDays: number;
    reason: string;
    typeId?: string; // Made optional for remote work requests
    actionBy?: string;
    actionAt?: Date;
    status: VacationStatus;
    progressStatus?: VacationProgressStatus;
    rejectionReason?: string;
    requestType: RequestType;
    requestedByUser?: any;    // User who requested
    actionByUser?: any;       // User who took action (approved/rejected)
    leaveType?: any;          // Leave type details
}