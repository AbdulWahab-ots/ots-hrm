import { DayName } from "../../enums";
import { ICompanyResponseBase } from "./response-base";
import { IDepartmentResponse } from "./department";

export interface IWorkingDaysResponse extends ICompanyResponseBase {
    dayOfWeek: number;
    dayName: DayName;
    isWorkingDay: boolean;
    notes?: string;
    // NEW: Department support
    departmentId?: string;
    department?: IDepartmentResponse;
}


export interface IWorkingDaysForDepartmentResponse {
    dayOfWeek: number;
    dayName: DayName;
    isWorkingDay: boolean;
    notes?: string;
}
