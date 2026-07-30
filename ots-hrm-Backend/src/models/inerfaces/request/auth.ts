import { EmployeeStatus } from "../../enums";

export interface IResendCodeRequest {
    email: string;
    whichPurpose: string;
}

export interface ILoginRequest {
    userName: string;
    password: string;
}

export interface IForgotPasswordRequest {
    email: string;
}

export interface IResetPasswordRequest {
    userId: string;
    code: string;
    newPassword: string;
}

export interface IVerifyRequest {
    userId: string;
    code: string;
    whichPurpose: string;
}

export interface IChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface IInviteSignUpRequest {
    inviteToken: string;
    userName: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: string;
    pictureUrl?: string;
    //Data for employee
    employeeCode?: string;
    address?: string;
    departmentId?: string;
    designationId?: string;
    joiningDate?: Date;
    status?: EmployeeStatus;
    probationEndDate?: Date;
    phoneNumber?: string;
    emergencyContact?: string;
    shiftId?: string;
    bankName?: string;
    accountNumber?: string;
    ibanNumber?: string;
}

export interface IValidateInviteTokenRequest {
    token: string;
}

export interface ISetPasswordRequest {
    token: string;
    newPassword: string;
}
