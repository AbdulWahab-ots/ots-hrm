import { IResponseBase } from "./response-base";
import { IRoleResponse } from "./role";
import { ICompanyResponse } from "./company";
import { InviteStatus, InviteRole } from "../../enums";

export interface IInviteResponse extends IResponseBase {
    email: string;
    token: string;
    status: InviteStatus;
    expiresAt: Date;
    acceptedAt?: Date;
    role: InviteRole;
    companyId?: string;
    inviteLink?: string;
}


// Response interface for bulk operations
export interface IBulkInviteResponse {
    successful: IInviteResponse[];
    failed: Array<{
        email: string;
        role: InviteRole;
        error: string;
    }>;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
}