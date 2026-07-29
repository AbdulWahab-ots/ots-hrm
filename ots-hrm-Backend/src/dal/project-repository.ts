import { injectable } from "tsyringe";
import { Project } from "../entities";
import { IProjectResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class ProjectRepository extends GenericRepository<Project, IProjectResponse> {
    constructor() {
        super(dataSource.getRepository(Project));
    }
}
