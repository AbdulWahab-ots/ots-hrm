import { inject, injectable } from "tsyringe";
import { ProjectRepository } from "../dal";
import { Project, clampProgress } from "../entities/project";
import { IProjectRequest, IProjectResponse, ITokenUser, ProjectStatus } from "../models";
import { Service } from "./generics/service";

@injectable()
export class ProjectService extends Service<Project, IProjectResponse, IProjectRequest> {
    constructor(
        @inject('ProjectRepository') private readonly projectRepository: ProjectRepository,
    ) {
        super(projectRepository, () => new Project());
    }

    // PATCH: keep progress within 0..100, and force 100 when a project is marked done
    // (spec 3.2). Only provided fields are written by the generic partial update.
    async update(id: string, request: IProjectRequest, contextUser: ITokenUser): Promise<IProjectResponse> {
        const normalized: IProjectRequest = { ...request };
        if (normalized.status === ProjectStatus.DONE) {
            normalized.progress = 100;
        } else if (normalized.progress !== undefined) {
            normalized.progress = clampProgress(normalized.progress);
        }
        return super.update(id, normalized, contextUser);
    }
}
