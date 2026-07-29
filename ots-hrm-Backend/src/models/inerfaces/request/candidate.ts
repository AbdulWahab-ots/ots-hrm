import { CandidateStage } from "../../enums";

export interface ICandidateRequest {
    name: string;
    role?: string;
    stage?: CandidateStage;
    owner?: string;
    source?: string;
    date?: string;            // last update date (ISO string)
    note?: string;
    currentCompany?: string;  // candidate's current/previous employer
    city?: string;
    email?: string;
    contact?: string;         // phone
    currentSalary?: string;   // free string, e.g. "PKR 180,000"
    expectedSalary?: string;
    score?: number;           // rating 0..100
    notice?: string;          // notice period, e.g. "30d"
}
