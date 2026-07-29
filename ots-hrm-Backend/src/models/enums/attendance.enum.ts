// Attendance Status Enum
export enum AttendanceStatus {
    DEFAULT = 'DEFAULT',
    PRESENT = 'PRESENT', 
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    HALF_DAY = 'HALF_DAY', 
    ON_LEAVE = 'ON_LEAVE',
    HOLIDAY = 'HOLIDAY',
    DAY_OFF = 'DAY_OFF'
}

export enum PresentStatus {
    CHECK_IN = 'CHECK_IN',
    CHECK_OUT = 'CHECK_OUT',
    ON_BREAK = 'ON_BREAK',
}

// Polymorphic Type Enum for Absence Reason
export enum AbsenceReasonType {
    Vacation = 'Vacation',
    PublicHoliday = 'PublicHoliday',
    RemoteWork = 'RemoteWork'
}

// Break Type Enum
export enum BreakType {
    LUNCH = 'LunchBreak',
    TEA = 'TeaBreak',
    MEETING = 'MeetingBreak',
    PRAYER = 'PrayerBreak',
    PERSONAL = 'PersonalBreak',
    SMOKING = 'SmokingBreak',
    OTHER = 'Other'
}