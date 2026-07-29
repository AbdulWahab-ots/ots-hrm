import { IResponseBase } from "./response-base";
import { IDefaultUserResponse, IUserResponse } from "./user";
import { User } from '../../../entities/user';

export interface ICompanyResponse extends IResponseBase {
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
    isSystemCompany?: boolean;
    user?: IDefaultUserResponse;
    users?: IUserResponse[];
}