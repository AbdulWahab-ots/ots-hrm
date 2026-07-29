import { NotificationType } from "../../enums";

export interface INotificationRequest {
    recipientUserId: string;
    title: string;
    message: string;
    type?: NotificationType;
    isRead?: boolean;
}
