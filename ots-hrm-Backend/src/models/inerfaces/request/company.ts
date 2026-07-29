import { IDefaultUserRequest } from "./user";
import { IInviteCreateRequest } from "./invite";

export interface ICompanyRequest {
    name: string;
    phoneNo?: string;
    email: string;
    address?: string;
    temporaryAddress?: string;
    zipCode?: number;
    country?: string;
    state?: string;
    city?: string;
    logoUrl?: string;
    defaultUser?: IDefaultUserRequest[];
    invites?: IInviteCreateRequest[];
}