import { ICompanyResponseBase } from "./response-base";
import { IDepartmentResponse } from "./department";
import { ICountryMinimalResponse } from "./country";
import { HolidayType } from "../../enums";

export interface IPublicHolidayResponse extends ICompanyResponseBase {
    departmentId?: string;
    name: string;
    dates: string[]; // Array of date strings
    isMultiple: boolean; // Flag to indicate if it's multiple dates
    type?: HolidayType; // Optional, e.g., "National", "Religious"
    description?: string; // Optional, additional details
    whichCountryId?: string; // Optional, ID of the country this holiday belongs to
    country?: ICountryMinimalResponse; // Minimal country response
    department?: IDepartmentResponse;
}