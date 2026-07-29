import { ICompanyResponseBase } from "./response-base";

export interface IAssessmentScoreResponse {
    id: string;
    assessmentId: string;
    skillId: string;
    score: number;
    skill?: {
        id: string;
        name: string;
        key: string;
        scaleMin: number;
        scaleMax: number;
        weight: number;
    };
}

export interface IAssessmentResponse extends ICompanyResponseBase {
    employeeId: string;
    assessedOn: Date;
    assessor?: string;
    note?: string;
    scores: IAssessmentScoreResponse[];
    overall: number;
}
