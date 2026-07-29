import { VacationStatus, VacationProgressStatus, RequestType } from "../../enums";

// ========================= VACATION REQUEST INTERFACE =========================
export interface IVacationRequest {
    requestedBy: string;
    fromDate: Date;
    toDate: Date;
    reason: string;
    typeId?: string; // Made optional to support remote work requests
    actionBy?: string;
    actionAt?: Date;
    status?: VacationStatus;
    progressStatus?: VacationProgressStatus;
    rejectionReason?: string;
    requestType?: RequestType;
}

export interface IVacationStatusRequest {
    status: VacationStatus;
    rejectionReason?: string;
}