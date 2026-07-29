export enum VacationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED', // when a vacation is rejected by the admin
    CANCELLED = 'CANCELLED' // when a vacation is cancelled by the admin after approval
}

export enum VacationProgressStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

export enum RequestType {
    LEAVE = 'LEAVE',
    REMOTE_WORK = 'REMOTE_WORK'
}