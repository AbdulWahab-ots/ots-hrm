import { ICompanyResponseBase } from "./response-base";
import { IDepartmentDesignationResponse } from "./designation";
import { IWorkingDaysForDepartmentResponse } from "./working-days";
import { IGeneralShiftResponse } from "./shift";
import { IBenefitResponse } from "./benefit";



export interface IDepartmentResponse extends ICompanyResponseBase {
    name: string;
    code?: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
    parent?: IDepartmentResponse;
    children: IDepartmentResponse[];
    designations?: IDepartmentDesignationResponse[];
    workingDays?: IWorkingDaysForDepartmentResponse[];
    shifts?: IGeneralShiftResponse[];
    benefits?: IBenefitResponse[];
}