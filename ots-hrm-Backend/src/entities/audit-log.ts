import { Column, Entity } from "typeorm";
import { EntityBase } from ".";
import { IAuditLogRequest, IAuditLogResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";

@Entity('AuditLog')
export class AuditLog extends EntityBase implements IToResponseBase<AuditLog, IAuditLogResponse> {
    @Column({type: 'text'})
    action!: 'added' | 'modified' | 'deleted';

    @Column({type: 'text'})
    model!: string;

    @Column({type: 'json', nullable: true})
    oldState?: string;

    @Column({type: 'json', nullable: true})
    newState?: string;

    @Column({type: 'text'})
    message!: string

    @Column({type: 'uuid', nullable: true})
    companyId?: string;

    @Column({type: 'uuid', nullable: false})
    entityId!: string;

    @Column({type: 'json', nullable: true})
    changedFields?: string

    toEntity(request: IAuditLogRequest, id?: string, contextUser?: ITokenUser): AuditLog {
        this.action = request.action;
        this.model = request.model;
        this.entityId = request.entityId;
        this.message = request.message;
        this.oldState = request.oldState;
        this.newState = request.newState;
        this.companyId = contextUser?.companyId ? contextUser.companyId :undefined;
        this.changedFields = JSON.stringify(request.changedFields);

        if(contextUser && !id) this.toBaseEntiy(contextUser);

        return this;
    }

    toResponse(entity?: AuditLog): IAuditLogResponse {
        
        if(!entity) entity = this;

        return {
            ...this.toResponseBase(entity),
            action: entity.action,
            message: entity.message,
            model: entity.model,
            entityId: entity.entityId,
            oldState: entity.oldState,
            newState: entity.newState,
            changedFields: entity.changedFields ? JSON.parse(entity.changedFields) : undefined
        }
    };
}