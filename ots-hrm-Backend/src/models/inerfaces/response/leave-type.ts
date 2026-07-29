import { GenderSpecific } from "../../enums";
import { IDepartmentResponse } from "./department";

export interface ILeaveTypeResponse {
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
    department?: IDepartmentResponse;
}
