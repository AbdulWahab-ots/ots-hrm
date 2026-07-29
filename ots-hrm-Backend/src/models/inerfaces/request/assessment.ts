export interface IAssessmentScoreRequest {
    skillId: string;
    score: number;
}

export interface IAssessmentRequest {
    employeeId: string;
    assessedOn: string;   // ISO date
    assessor?: string;
    note?: string;
    scores?: IAssessmentScoreRequest[];
}
