import { CandidateStage } from "../../enums";
import { ICompanyResponseBase } from "./response-base";

export interface ICandidateResponse extends ICompanyResponseBase {
    name: string;
    role: string;
    stage: CandidateStage;
    owner?: string;
    source?: string;
    date?: Date;
    note?: string;
    currentCompany?: string;
    city?: string;
    email?: string;
    contact?: string;
    currentSalary?: string;
    expectedSalary?: string;
    score?: number;
    notice?: string;
}
