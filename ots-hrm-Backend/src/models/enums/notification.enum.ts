export enum NotificationType {
    LEAVE_STATUS = 'LEAVE_STATUS',                 // a leave/remote-work request was approved or rejected
    PAYSLIP = 'PAYSLIP',                           // a payslip was generated for the employee
    ANNOUNCEMENT = 'ANNOUNCEMENT',                 // a company announcement was posted
    CHECK_IN_REMINDER = 'CHECK_IN_REMINDER',       // reminder to check in for today's attendance
    CHECK_OUT_REMINDER = 'CHECK_OUT_REMINDER',     // reminder to check out for today's attendance
    LATE_ARRIVAL = 'LATE_ARRIVAL',                 // an employee checked in past the late-arrival alert grace period
    BIRTHDAY = 'BIRTHDAY',                         // today is the employee's birthday
    WORK_ANNIVERSARY = 'WORK_ANNIVERSARY',         // today is the employee's Nth work anniversary
    GENERAL = 'GENERAL',                           // anything else
}
