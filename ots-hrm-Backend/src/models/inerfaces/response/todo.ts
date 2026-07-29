import { ICompanyResponseBase } from "./response-base";
import { IUserResponse } from "./user";

export interface IToDoResponse extends ICompanyResponseBase {
    todo: string;
    details: string;
    userId: string;
    completed: boolean;
    dueDate: Date;
    user?: IUserResponse
}