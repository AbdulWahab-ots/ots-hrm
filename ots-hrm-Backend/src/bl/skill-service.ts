import { inject, injectable } from "tsyringe";
import { SkillRepository, AssessmentScoreRepository } from "../dal";
import { Skill } from "../entities";
import { ISkillRequest, ISkillResponse, ITokenUser } from "../models";
import { Service } from "./generics/service";

@injectable()
export class SkillService extends Service<Skill, ISkillResponse, ISkillRequest> {
    constructor(
        @inject('SkillRepository') private readonly skillRepository: SkillRepository,
        @inject('AssessmentScoreRepository') private readonly scoreRepository: AssessmentScoreRepository,
    ) {
        super(skillRepository, () => new Skill());
    }

    // Delete only when the skill has no recorded scores; otherwise preserve history
    // by soft-deactivating it (spec 4: "delete ONLY if unused; else soft-deactivate").
    async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const inUse = await this.scoreRepository.countBySkill(id);
        if (inUse > 0) {
            await this.skillRepository.partialUpdate(id, { active: false } as any, contextUser);
            return;
        }
        await super.delete(id, contextUser);
    }
}
