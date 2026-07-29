import { injectable } from "tsyringe";
import { Skill } from "../entities";
import { ISkillResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class SkillRepository extends GenericRepository<Skill, ISkillResponse> {
    constructor() {
        super(dataSource.getRepository(Skill));
    }
}
