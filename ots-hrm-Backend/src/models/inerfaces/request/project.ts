import { ProjectStatus } from "../../enums";

export interface IProjectRequest {
    name: string;
    owner?: string;
    status?: ProjectStatus;
    progress?: number;   // 0..100
    due?: string;        // ISO date string
    note?: string;
}
