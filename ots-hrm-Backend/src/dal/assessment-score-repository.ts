import { injectable } from "tsyringe";
import { AssessmentScore } from "../entities";
import { IAssessmentScoreResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class AssessmentScoreRepository extends GenericRepository<AssessmentScore, IAssessmentScoreResponse> {
    constructor() {
        super(dataSource.getRepository(AssessmentScore));
    }

    // How many stored scores reference a given skill (used to block hard-deletes).
    async countBySkill(skillId: string): Promise<number> {
        return this.repository.count({ where: { skillId: skillId as any, deleted: false } });
    }
}
