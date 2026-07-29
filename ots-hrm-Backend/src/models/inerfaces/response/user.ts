import { Gender, UserStatus } from "../../enums";
import { ICompanyResponse } from "./company";
import { IEmployeeResponse } from "./employee";
import { IResponseBase } from "./response-base";
import { IRoleResponse } from "./role";
import { IEmployeeBenefitResponse } from "./employee-benefit";

export interface IUserResponse extends IResponseBase {
    userName: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth?: Date;
    status: UserStatus;
    gender: Gender;
    lastLogin?: Date;
    lastOnline?: Date;
    roleId: string;
    role?: IRoleResponse;
    pictureUrl?: string;
    companyId?: string;
    company?: ICompanyResponse;
    isGoogleSignup: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    phoneNumber?: string;
    employee?: IEmployeeResponse;
    employeeBenefits?: IEmployeeBenefitResponse[];
}

export interface IBulkUserResponse {
    successful: IUserResponse[];
    failed: Array<{
        userName: string;
        email: string;
        error: string;
    }>;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
}

export interface IDefaultUserResponse extends IResponseBase {
    userName: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth?: Date;
    status: UserStatus;
    gender: Gender;
    lastLogin?: Date;
    lastOnline?: Date;
    roleId: string;
    role?: IRoleResponse;
    pictureUrl?: string;
    isGoogleSignup: boolean;
}