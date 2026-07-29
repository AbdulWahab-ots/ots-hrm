import { ICompanyResponseBase } from "./response-base";
import { IDepartmentResponse } from "./department";
import { BenefitType, BenefitValueType, BenefitFrequency } from "../../enums";

export interface IBenefitResponse extends ICompanyResponseBase {
    name: string;
    code?: string;
    description?: string;
    type: BenefitType;
    value?: number;
    valueType?: BenefitValueType;
    frequency?: BenefitFrequency;
    startDate?: Date;
    endDate?: Date;
    sortOrder?: number;
    departmentId?: string;
    department?: IDepartmentResponse;
}
