// Hiring pipeline stages (candidates), in board order.
export enum CandidateStage {
    APPLIED = 'applied',
    SCREEN = 'screen',
    INTERVIEW = 'interview',
    OFFER = 'offer',
    HIRED = 'hired',
    REJECTED = 'rejected',
}

// Project work statuses.
export enum ProjectStatus {
    TODO = 'todo',
    PROGRESS = 'progress',
    BLOCKED = 'blocked',
    DONE = 'done',
}
