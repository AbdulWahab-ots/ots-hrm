import { LevelHierarchy } from "../../enums";
import { ICompanyResponseBase } from "./response-base";
import { IDepartmentResponse } from "./department";

export interface IDesignationResponse extends ICompanyResponseBase {
    departmentId?: string;
    title: string;
    code?: string;
    jobDescription?: string;
    levelHierarchy: LevelHierarchy;
    responsibilities?: string;
    sortOrder?: number;
    department?: IDepartmentResponse;
}

export interface IDepartmentDesignationResponse extends ICompanyResponseBase {
    departmentId?: string;
    title: string;
    code?: string;
    jobDescription?: string;
    levelHierarchy: LevelHierarchy;
    responsibilities?: string;
    sortOrder?: number;
}