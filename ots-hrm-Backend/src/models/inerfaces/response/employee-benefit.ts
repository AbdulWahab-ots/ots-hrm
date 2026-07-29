import { EmployeeBenefitStatus } from "../../enums/employee-benefit.enum";
import { IResponseBase } from "./response-base";
import { IBenefitResponse } from "./benefit";
import { IUserResponse } from "./user";
import { IEmployeeResponse } from "./employee";

export interface IEmployeeBenefitResponse extends IResponseBase {
    userId: string;
    employeeId: string;
    benefitId: string;
    effectiveDate: Date;
    endDate?: Date;
    customValue?: number;
    notes?: string;
    user?: IUserResponse;
    employee?: IEmployeeResponse;
    benefit?: IBenefitResponse;
} 