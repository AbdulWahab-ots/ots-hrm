import { EmployeeStatus } from "../../enums";
import { IDefaultUserRequest } from "./user";
import { IEmployeeBenefitRequest } from "./employee-benefit";

// Employee Request Interface
export interface IEmployeeRequest {
    userId: string;
    employeeCode: string;
    departmentId: string;
    designationId: string;
    joiningDate: Date;
    salary?: number;
    status?: EmployeeStatus;
    address?: string;
    phoneNumber?: string;
    emergencyContact?: string;
    probationEndDate?: Date;
    departureDate?: Date;
    dateOfBirth?: Date;
    shiftId?: string; // Optional shift assignment
    user: IDefaultUserRequest;
    benefits?: IEmployeeBenefitRequest[];
    // Bank Details
    bankName?: string;
    accountNumber?: string;
    ibanNumber?: string;
    zkDeviceUserId?: string;
}