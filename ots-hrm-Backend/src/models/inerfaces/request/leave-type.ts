import { GenderSpecific } from "../../enums";

export interface ILeaveTypeRequest {
    departmentId?: string;
    name: string;
    code?: string;
    description?: string;
    maxDaysPerYear: number;
    maxConsecutiveDays: number;
    isPaid: boolean;
    requiresApproval: boolean;
    canBeCarriedForward: boolean;
    carryForwardLimit: number;
    genderSpecific: GenderSpecific;
}