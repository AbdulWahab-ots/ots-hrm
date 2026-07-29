import { IPrivilegeResponse } from "./privilege";
import { ICompanyResponseBase, IResponseBase } from "./response-base";

export interface IRoleResponse extends IResponseBase {
    name: string;
    code: string;
    companyId?: string;
    privileges?: Array<IPrivilegeResponse>;
}