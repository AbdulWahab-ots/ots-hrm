import { Column, Entity, Index } from "typeorm";
import { INotificationRequest, INotificationResponse, ITokenUser, NotificationType } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";

@Entity('Notification')
// Notifications are read back per-recipient; index the common query (mine, unread first).
@Index(['companyId', 'recipientUserId', 'isRead'])
export class Notification extends CompanyEntityBase implements IToResponseBase<Notification, INotificationResponse> {

    // The User this notification is for.
    @Column({ type: 'uuid', nullable: false })
    recipientUserId!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title!: string;

    @Column({ type: 'text', nullable: false })
    message!: string;

    @Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
    type!: NotificationType;

    @Column({ type: 'boolean', default: false })
    isRead!: boolean;

    toResponse(entity?: Notification): INotificationResponse {
        if (!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            recipientUserId: entity.recipientUserId,
            title: entity.title,
            message: entity.message,
            type: entity.type,
            isRead: entity.isRead,
        };
    }

    toEntity = (entityRequest: INotificationRequest, id?: string, contextUser?: ITokenUser): Notification => {
        this.recipientUserId = entityRequest.recipientUserId;
        this.title = entityRequest.title;
        this.message = entityRequest.message;
        this.type = entityRequest.type ?? NotificationType.GENERAL;
        this.isRead = entityRequest.isRead ?? false;

        if (contextUser) super.toCompanyEntity(contextUser, id);

        return this;
    }
}
