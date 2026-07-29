import { IResponseBase } from "./response-base";
import { IRoleResponse } from "./role";

export interface IPrivilegeResponse extends IResponseBase {
    name: string;
    code: string;
    module: string;
    roles?: Array<IRoleResponse>;
}