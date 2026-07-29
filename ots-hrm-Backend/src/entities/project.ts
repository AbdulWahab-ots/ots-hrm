import { Column, Entity } from "typeorm";
import { IProjectRequest, IProjectResponse, ITokenUser, ProjectStatus } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";

// Clamps a progress value into 0..100 (defaults to 0 when not a finite number).
const clampProgress = (value?: number): number => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return 0;
    return Math.min(100, Math.max(0, Math.trunc(Number(value))));
};

@Entity('Project')
export class Project extends CompanyEntityBase implements IToResponseBase<Project, IProjectResponse> {

    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    owner?: string;

    @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.TODO })
    status!: ProjectStatus;

    @Column({ type: 'int', default: 0 })
    progress!: number;

    @Column({ type: 'date', nullable: true })
    due?: Date;

    @Column({ type: 'text', nullable: true })
    note?: string;

    toResponse(entity?: Project): IProjectResponse {
        if (!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            owner: entity.owner,
            status: entity.status,
            progress: entity.progress,
            due: entity.due,
            note: entity.note,
        };
    }

    toEntity = (entityRequest: IProjectRequest, id?: string, contextUser?: ITokenUser): Project => {
        this.name = entityRequest.name;
        this.owner = entityRequest.owner;
        this.status = entityRequest.status ?? ProjectStatus.TODO;
        // A "done" project is always 100% complete; otherwise clamp to 0..100.
        this.progress = this.status === ProjectStatus.DONE ? 100 : clampProgress(entityRequest.progress);
        this.due = entityRequest.due ? new Date(entityRequest.due) : undefined;
        this.note = entityRequest.note;

        if (contextUser) super.toCompanyEntity(contextUser, id);

        return this;
    }
}

export { clampProgress };
