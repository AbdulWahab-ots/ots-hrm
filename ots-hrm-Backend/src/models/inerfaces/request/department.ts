import { IWorkingDayRequest } from "./working-days";

export interface IDepartmentRequest {
    name: string;
    code?: string;
    description?: string;
    parentId?: string;
    status?: 'active' | 'inactive';
    sortOrder?: number;
    workingDays?: IWorkingDayRequest[]; // Optional working days for the department
}