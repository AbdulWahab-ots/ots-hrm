import { injectable } from "tsyringe";
import { Notification } from "../entities";
import { INotificationResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class NotificationRepository extends GenericRepository<Notification, INotificationResponse> {

    constructor () {
        super(dataSource.getRepository(Notification));
    }

    /** Mark every unread notification for a recipient (within a company) as read. */
    async markAllReadForUser(recipientUserId: string, companyId: string): Promise<number> {
        const result = await this.repository.update(
            { recipientUserId, companyId, isRead: false, deleted: false },
            { isRead: true }
        );
        return result.affected ?? 0;
    }

}
