import { ICompanyResponseBase } from "./response-base";

export interface ISkillResponse extends ICompanyResponseBase {
    name: string;
    key: string;
    description?: string;
    scaleMin: number;
    scaleMax: number;
    weight: number;
    sortOrder?: number;
}
