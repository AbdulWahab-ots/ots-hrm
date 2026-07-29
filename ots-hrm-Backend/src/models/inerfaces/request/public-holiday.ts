import { LevelHierarchy } from "../../enums";


export interface IPublicHolidayRequest {
    name: string;
    dates: string[]; // Array of date strings (can contain single or multiple dates)
    isMultiple: boolean; // Flag to indicate if it's multiple dates
    type?: string; // Optional, e.g., "National", "Religious"
    description?: string; // Optional, additional details
    whichCountryId?: string; // Optional, ID of the country this holiday belongs to
    departmentId: string; // ID of the department this holiday applies to
}