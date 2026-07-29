import { Column, Entity, Index } from "typeorm";
import { IAnnouncementRequest, IAnnouncementResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";

@Entity('Announcement')
// Company-scoped. "Posted by" and "date" come from the audit fields on the base
// (createdBy / createdAt), so the entity only carries the message itself.
@Index(['companyId', 'deleted'])
export class Announcement extends CompanyEntityBase implements IToResponseBase<Announcement, IAnnouncementResponse> {

    @Column({ type: 'varchar', length: 255, nullable: false })
    title!: string;

    @Column({ type: 'text', nullable: false })
    description!: string;

    toResponse(entity?: Announcement): IAnnouncementResponse {
        if (!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            title: entity.title,
            description: entity.description,
        };
    }

    toEntity = (entityRequest: IAnnouncementRequest, id?: string, contextUser?: ITokenUser): Announcement => {
        this.title = entityRequest.title;
        this.description = entityRequest.description;

        if (contextUser) super.toCompanyEntity(contextUser, id);

        return this;
    }
}
