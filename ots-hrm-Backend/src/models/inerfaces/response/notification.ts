import { NotificationType } from "../../enums";
import { ICompanyResponseBase } from "./response-base";

export interface INotificationResponse extends ICompanyResponseBase {
    recipientUserId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
}
