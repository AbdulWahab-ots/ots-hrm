import { InviteRole, InviteStatus } from "../../enums";
import { IEmployeeBenefitRequest } from "./employee-benefit";

// Public interface for API requests (companyId optional for super admin)
export interface IInviteCreateRequest {
    email: string;
    role?: InviteRole;
    companyId?: string; // Optional for super admin
    // Employee-specific fields (required only when role is EMPLOYEE)
    salary?: number;
    benefits?: IEmployeeBenefitRequest[];
    departmentId?: string;
}

// Interface for bulk invite creation
export interface IBulkInviteCreateRequest {
    invites: IInviteCreateRequest[];
}

// Union type for handling both single and bulk invite requests
export type IInviteRequestBody = IInviteCreateRequest | IBulkInviteCreateRequest;

// Internal interface for service layer (with companyId)
export interface IInviteRequest {
    email: string;
    token: string;
    status: InviteStatus;
    expiresAt: Date;
    acceptedAt?: Date;
    role: InviteRole;
}

export interface IInviteUpdateRequest {
    status?: InviteStatus;
    expiresAt?: Date;
    message?: string;
}
