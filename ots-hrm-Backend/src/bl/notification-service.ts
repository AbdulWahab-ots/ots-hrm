import { inject, injectable } from "tsyringe";
import { FindManyOptions, FindOptionsWhere } from "typeorm";
import { NotificationRepository, UserRepository } from "../dal";
import { Notification } from "../entities";
import { INotificationRequest, INotificationResponse, IDataSourceResponse, IFetchRequest, ITokenUser, NotificationType } from "../models";
import { Service } from "./generics/service";
import { setSaurceDataResponse } from "../utility";
import { sendNotificationEmail } from "../utility/mail-utility";

// Input for a single notification, minus the recipient (passed separately).
export interface INotificationPayload {
    title: string;
    message: string;
    type?: NotificationType;
    // Skip the automatic generic (title/message) notification email — set by callers
    // that send their own dedicated, purpose-built email template instead (e.g. the
    // Late Arrival alert), so the recipient doesn't get two emails for one event.
    skipEmail?: boolean;
}

@injectable()
export class NotificationService extends Service<Notification, INotificationResponse, INotificationRequest> {
    constructor(
        @inject('NotificationRepository') private readonly notificationRepository: NotificationRepository,
        @inject('UserRepository') private readonly userRepository: UserRepository,
    ) {
        super(notificationRepository, () => new Notification());
    }

    /**
     * Create one in-app notification for a recipient and best-effort email them.
     * Email failures never block the notification (sendMail already swallows errors).
     */
    async createNotification(
        recipientUserId: string,
        payload: INotificationPayload,
        contextUser: ITokenUser
    ): Promise<INotificationResponse> {
        const created = await super.add(
            {
                recipientUserId,
                title: payload.title,
                message: payload.message,
                type: payload.type ?? NotificationType.GENERAL,
                isRead: false,
            },
            contextUser
        );

        // Best-effort email — look up the recipient's address; skip silently if missing.
        if (!payload.skipEmail) {
            try {
                const user = await this.userRepository.findOneById(recipientUserId);
                if (user?.email) {
                    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.userName || "there";
                    await sendNotificationEmail(user.email, { name, title: payload.title, message: payload.message });
                }
            } catch {
                // Notification is already saved; email is non-critical.
            }
        }

        return created;
    }

    /** Create the same notification for many recipients (e.g. a company-wide announcement). */
    async createForUsers(
        recipientUserIds: string[],
        payload: INotificationPayload,
        contextUser: ITokenUser
    ): Promise<void> {
        // ponytail: per-recipient create + email in parallel, best-effort. Fine for a
        // typical company headcount; move to a background job/queue if it grows large.
        await Promise.allSettled(
            recipientUserIds.map((userId) => this.createNotification(userId, payload, contextUser))
        );
    }

    /**
     * The calling user's notifications, newest first (paged).
     *
     * The recipient scope is enforced as a fixed `where` straight on the repository, NOT
     * via the caller-supplied filtersRequest pipeline — a crafted OR filter on
     * recipientUserId in that pipeline could otherwise override the scope and expose other
     * users' notifications. companyId + recipientUserId here are non-negotiable.
     */
    async getMine(contextUser: ITokenUser, fetchRequest?: IFetchRequest<INotificationRequest>): Promise<IDataSourceResponse<INotificationResponse>> {
        const pageNo = fetchRequest?.pagedListRequest?.pageNo ?? 1;
        const pageSize = fetchRequest?.pagedListRequest?.pageSize ?? 10;
        const getAllRecords = fetchRequest?.pagedListRequest?.getAllRecords ?? false;

        const where: FindOptionsWhere<Notification> = {
            recipientUserId: contextUser.id,
            companyId: contextUser.companyId,
            deleted: false,
        };

        const findOptions: FindManyOptions<Notification> = {
            where,
            order: { createdAt: "DESC" },
        };
        if (!getAllRecords) {
            findOptions.skip = (pageNo - 1) * pageSize;
            findOptions.take = pageSize;
        }

        const entities = await this.notificationRepository.where(findOptions);
        const total = await this.notificationRepository.entityCount(where);
        return setSaurceDataResponse<Notification, INotificationResponse>(entities, total, pageSize, pageNo);
    }

    /** Count of the caller's unread notifications. */
    async getUnreadCount(contextUser: ITokenUser): Promise<{ count: number }> {
        const count = await this.notificationRepository.entityCount({
            recipientUserId: contextUser.id,
            companyId: contextUser.companyId,
            isRead: false,
            deleted: false,
        } as any);
        return { count };
    }

    /** Mark one of the caller's notifications read (ownership enforced). */
    async markRead(id: string, contextUser: ITokenUser): Promise<INotificationResponse | null> {
        const existing = await this.notificationRepository.firstOrDefault({
            where: { id, recipientUserId: contextUser.id, companyId: contextUser.companyId } as any,
        });
        if (!existing) return null;
        await this.notificationRepository.partialUpdate(id, { isRead: true } as any, contextUser);
        return this.notificationRepository.findOneByIdWithResponse(id);
    }

    /** Mark all of the caller's unread notifications read. */
    async markAllRead(contextUser: ITokenUser): Promise<{ updated: number }> {
        const updated = await this.notificationRepository.markAllReadForUser(contextUser.id, contextUser.companyId);
        return { updated };
    }
}
