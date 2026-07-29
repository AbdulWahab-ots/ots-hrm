import { ShiftType } from "../../enums";
import { ICompanyResponseBase } from "./response-base";
import { IDepartmentResponse } from "./department";

// Response Interface
export interface IShiftResponse extends ICompanyResponseBase {
    name: string;
    code: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    workingHours: number; // Working hours in minutes
    marginTime: number; // Margin time in minutes
    breakDuration: number;
    order: number;
    departmentId?: string;
    department?: IDepartmentResponse;
}

// Lightweight shift response for department context to avoid circular references
export interface IGeneralShiftResponse {
    id: string;
    name: string;
    code: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    workingHours: number;
    marginTime: number; // Margin time in minutes
    breakDuration: number;
    order: number;
}