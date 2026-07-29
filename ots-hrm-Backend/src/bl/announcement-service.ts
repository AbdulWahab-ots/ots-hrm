import { inject, injectable } from "tsyringe";
import { AnnouncementRepository, EmployeeRepository } from "../dal";
import { Announcement } from "../entities";
import { IAnnouncementRequest, IAnnouncementResponse, ITokenUser, NotificationType } from "../models";
import { Service } from "./generics/service";
import { NotificationService } from "./notification-service";

// Plain company-scoped CRUD — the generic Service covers add/get/getById/update/delete.
// On create, every employee in the company is notified of the new announcement.
@injectable()
export class AnnouncementService extends Service<Announcement, IAnnouncementResponse, IAnnouncementRequest> {
    constructor(
        @inject('AnnouncementRepository') private readonly announcementRepository: AnnouncementRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('NotificationService') private readonly notificationService: NotificationService,
    ) {
        super(announcementRepository, () => new Announcement());
    }

    async add(request: IAnnouncementRequest, contextUser: ITokenUser): Promise<IAnnouncementResponse> {
        const created = await super.add(request, contextUser);

        // Notify every active employee in the company (except the poster). Best-effort —
        // never let notification fan-out break announcement creation.
        try {
            const employees = await this.employeeRepository.where({
                where: { companyId: contextUser.companyId, active: true, deleted: false },
            });
            const recipientUserIds = employees
                .map((e) => e.userId)
                .filter((userId): userId is string => !!userId && userId !== contextUser.id);

            if (recipientUserIds.length > 0) {
                await this.notificationService.createForUsers(
                    recipientUserIds,
                    {
                        title: request.title,
                        message: request.description,
                        type: NotificationType.ANNOUNCEMENT,
                    },
                    contextUser
                );
            }
        } catch {
            // announcement already created; notifications are non-critical.
        }

        return created;
    }
}
