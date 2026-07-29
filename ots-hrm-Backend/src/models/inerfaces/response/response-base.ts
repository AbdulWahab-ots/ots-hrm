import { ICompanyResponse } from "./company";

export interface IResponseBase {
    id: string;
    createdAt: Date;
    active: boolean;
    createdBy: string;
    createdById: string;
    modifiedAt?: Date;
    modifiedBy?: string;
    modifiedById?: string;
}

export interface ICompanyResponseBase extends IResponseBase {
    companyId: string;
    company?: ICompanyResponse;
}