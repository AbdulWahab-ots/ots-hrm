// Request Interface
export interface IUserShiftRequest {
    userId: string;
    shiftId: string;
    effectiveFrom: Date;
    effectiveTo?: Date; // NULL means ongoing
}

// Request Interface for assigning shifts
export interface IAssignShiftRequest {
    userId: string;
    shiftId: string;
}