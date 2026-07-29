import { BenefitType, BenefitValueType, BenefitFrequency } from "../../enums";

export interface IBenefitRequest {
    name: string;
    code?: string;
    description?: string;
    type: BenefitType;
    value?: number; // monetary value if applicable
    valueType?: BenefitValueType;
    frequency?: BenefitFrequency;
    startDate?: Date;
    endDate?: Date;
    sortOrder?: number;
    departmentId?: string; // Optional - null means it's for the whole company
}
