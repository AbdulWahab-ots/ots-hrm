import { EmployeeStatus } from "../../enums";
import { IUserResponse } from "./user";
import { ICompanyResponseBase } from "./response-base";
import { IDepartmentResponse } from "./department";
import { IDesignationResponse } from "./designation";
import { IShiftResponse } from "./shift";
import { IEmployeeBenefitResponse } from "./employee-benefit";

// Surfaced when a non-critical setup step (benefits, shift) could not be completed
// during create/onboard. The employee is still created; the admin can finish the step
// from the profile screen.
export interface IEmployeeSetupWarning {
    step: 'benefits' | 'shift' | 'welcomeEmail';
    message: string;
}

// Employee Response Interface
export interface IEmployeeResponse extends ICompanyResponseBase {
    userId: string;
    employeeCode: string;
    departmentId: string;
    designationId: string;
    shiftId?: string;
    joiningDate: Date;
    salary?: number;
    status: EmployeeStatus;
    address?: string;
    phoneNumber?: string;
    emergencyContact?: string;
    probationEndDate?: Date;
    departureDate?: Date | null;
    dateOfBirth?: Date | null;
    user?: IUserResponse;
    department?: IDepartmentResponse;
    designation?: IDesignationResponse; 
    shift?: IShiftResponse;
    benefits?: IEmployeeBenefitResponse[];
    // Bank Details
    bankName?: string;
    accountNumber?: string;
    ibanNumber?: string;
    zkDeviceUserId?: string;
    // Populated only when a deferred setup step did not complete (see IEmployeeSetupWarning)
    warnings?: IEmployeeSetupWarning[];
}


export interface IEmployeeStatsResponse {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    newJoinings: number;
}