import { IPrivilegeResponse } from "./privilege";
import { IResponseBase } from "./response-base";

export interface IModuleResponse extends IResponseBase {
    name: string;
    code: string;
    privileges?: Array<IPrivilegeResponse>;
}