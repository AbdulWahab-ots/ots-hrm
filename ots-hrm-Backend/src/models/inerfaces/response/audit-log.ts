import { IResponseBase } from "./response-base";

export interface IAuditLogResponse extends IResponseBase {
    action: 'added' | 'modified' | 'deleted';
    model: string;
    oldState?: string;
    companyId?: string;
    newState?: string;
    message: string
    entityId: string;
    changedFields?: Array<string>
}
