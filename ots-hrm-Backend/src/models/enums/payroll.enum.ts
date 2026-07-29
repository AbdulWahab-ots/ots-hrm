export enum PayrollStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PAID = 'PAID',
    CANCELLED = 'CANCELLED'
}

export enum AdjustmentType {
    ADDITION = 'ADDITION',
    DEDUCTION = 'DEDUCTION'
}

export enum AdjustmentCategory {
    BONUS = 'BONUS',
    BENEFIT = 'BENEFIT',
    OVERTIME = 'OVERTIME',
    ALLOWANCE = 'ALLOWANCE',
    TAX = 'TAX',
    INSURANCE = 'INSURANCE',
    LOAN = 'LOAN',
    ADVANCE = 'ADVANCE',
    OTHER = 'OTHER',
    ABSENT = 'ABSENT',
    EARLY_LEAVE = 'EARLY_LEAVE',
    LATE = 'LATE'
}