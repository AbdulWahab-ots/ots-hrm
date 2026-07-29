import { Invite } from '../../entities/invite';
import { DefaultRoles } from '../../constants'; // Adjust the path if needed
export enum InviteStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED'
}
export enum InviteExpiryDuration {
    ONE_DAY = 1,
    THREE_DAYS = 3,
    ONE_WEEK = 7,
    TWO_WEEKS = 14,
    ONE_MONTH = 30
}
export enum InviteRole {
    ADMIN = DefaultRoles.Admin,
    EMPLOYEE = DefaultRoles.Employee,
}

