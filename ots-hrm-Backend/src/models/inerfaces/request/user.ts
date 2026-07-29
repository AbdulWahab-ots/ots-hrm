import { User } from "../../../entities";
import { Gender, UserRole } from "../../enums";

export interface IDefaultUserRequest {
    userName: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: Gender;
    dateOfBirth?: Date;
    phoneNumber?: string;
    pictureUrl?: string;
    isGoogleSignup: boolean;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
}

export interface IUserRequest {
    userName: string;
    email: string;
    password?: string;
    firstName: string;
    middleName?: string;
    gender?: Gender;
    lastName: string;
    dateOfBirth?: Date;
    roleId: string;
    phoneNumber?: string;
    pictureUrl?: string;
    isGoogleSignup: boolean;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    companyId?: string; // Optional, required for super admin
    // For super admin, companyId must be provided, for admin it will be taken from
}

export interface ISignUpRequest {
    userName: string;
    email: string;
    phoneNumber?: string;
    password?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender?: Gender;
    dateOfBirth?: Date;
    pictureUrl?: string;
    address?: string;
    temporaryAddress?: string;
    country?: string;
    state?: string;
    city?: string; 
    zipCode?: number;
}

export interface ICreateUserRequest {
    userName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: UserRole
    companyId?: string; // Required for super admin, optional for admin (will be taken from token)
    gender?: Gender;
    dateOfBirth?: Date;
    phoneNumber?: string;
    pictureUrl?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
}

export interface IBulkCreateUsersRequest {
    users: ICreateUserRequest[];
}

// Union type for handling both single and bulk user creation requests
export type ICreateUserRequestBody = ICreateUserRequest | IBulkCreateUsersRequest;
