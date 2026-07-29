import { ICompanyResponseBase } from "./response-base";

// "Posted by" = createdBy and "date" = createdAt from ICompanyResponseBase.
export interface IAnnouncementResponse extends ICompanyResponseBase {
    title: string;
    description: string;
}
