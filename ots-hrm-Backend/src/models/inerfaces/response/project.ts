import { ProjectStatus } from "../../enums";
import { ICompanyResponseBase } from "./response-base";

export interface IProjectResponse extends ICompanyResponseBase {
    name: string;
    owner?: string;
    status: ProjectStatus;
    progress: number;
    due?: Date;
    note?: string;
}
