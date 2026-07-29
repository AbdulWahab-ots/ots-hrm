import { inject, injectable } from "tsyringe";
import { In } from "typeorm";
import { randomUUID } from "crypto";
import { AssessmentRepository, SkillRepository, EmployeeRepository } from "../dal";
import { Assessment, AssessmentScore, Skill } from "../entities";
import { IAssessmentRequest, IAssessmentResponse, IAssessmentScoreRequest, ITokenUser, Actions } from "../models";
import { AppError } from "../utility/app-error";

@injectable()
export class AssessmentService {
    constructor(
        @inject('AssessmentRepository') private readonly assessmentRepository: AssessmentRepository,
        @inject('SkillRepository') private readonly skillRepository: SkillRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
    ) {}

    // All assessments for one employee (chart data), tenant-scoped.
    async getForEmployee(employeeId: string, contextUser: ITokenUser): Promise<IAssessmentResponse[]> {
        await this.assertEmployeeInCompany(employeeId, contextUser);
        const rows = await this.assessmentRepository.findForEmployee(employeeId, contextUser.companyId);
        return rows.map((a) => a.toResponse(a));
    }

    async create(req: IAssessmentRequest, contextUser: ITokenUser): Promise<IAssessmentResponse> {
        await this.assertEmployeeInCompany(req.employeeId, contextUser);
        const scores = req.scores || [];
        if (!scores.length) throw new AppError("At least one score is required", "400");

        const skillMap = await this.loadAndValidateSkills(scores, contextUser);
        const assessedOn = new Date(req.assessedOn);

        // Upsert on (employeeId, assessedOn): update the existing dated assessment instead of duplicating.
        const existing = await this.assessmentRepository.findByEmployeeAndDate(
            req.employeeId,
            assessedOn,
            contextUser.companyId
        );

        const queryRunner = await this.assessmentRepository.beginTransaction();
        try {
            let assessment: Assessment;
            if (existing) {
                existing.assessor = req.assessor;
                existing.note = req.note;
                existing.modifiedAt = new Date();
                existing.modifiedBy = contextUser.name;
                existing.modifiedById = contextUser.id;
                assessment = await queryRunner.manager.save(existing);
                await queryRunner.manager.delete(AssessmentScore, { assessmentId: existing.id });
            } else {
                assessment = new Assessment().toEntity(req, undefined, contextUser);
                assessment.assessedOn = assessedOn;
                assessment = await queryRunner.manager.save(assessment);
            }

            const scoreEntities = scores.map((s) =>
                this.buildScore(assessment.id, s, skillMap.get(s.skillId)!, contextUser)
            );
            await queryRunner.manager.save(scoreEntities);
            await this.assessmentRepository.commitTransaction(queryRunner);
        } catch (err) {
            await this.assessmentRepository.rollbackTransaction(queryRunner);
            throw err;
        }

        const saved = await this.assessmentRepository.findByEmployeeAndDate(req.employeeId, assessedOn, contextUser.companyId);
        const full = saved ? await this.assessmentRepository.findByIdWithScores(saved.id, contextUser.companyId) : null;
        return full!.toResponse(full!);
    }

    async update(id: string, req: IAssessmentRequest, contextUser: ITokenUser): Promise<IAssessmentResponse> {
        const existing = await this.assessmentRepository.findByIdWithScores(id, contextUser.companyId);
        if (!existing) throw new AppError("Assessment not found", "404");

        let skillMap: Map<string, Skill> | null = null;
        if (req.scores && req.scores.length) {
            skillMap = await this.loadAndValidateSkills(req.scores, contextUser);
        }

        const queryRunner = await this.assessmentRepository.beginTransaction();
        try {
            if (req.assessedOn) existing.assessedOn = new Date(req.assessedOn);
            if (req.assessor !== undefined) existing.assessor = req.assessor;
            if (req.note !== undefined) existing.note = req.note;
            existing.modifiedAt = new Date();
            existing.modifiedBy = contextUser.name;
            existing.modifiedById = contextUser.id;
            await queryRunner.manager.save(existing);

            if (req.scores && skillMap) {
                await queryRunner.manager.delete(AssessmentScore, { assessmentId: existing.id });
                const scoreEntities = req.scores.map((s) =>
                    this.buildScore(existing.id, s, skillMap!.get(s.skillId)!, contextUser)
                );
                await queryRunner.manager.save(scoreEntities);
            }
            await this.assessmentRepository.commitTransaction(queryRunner);
        } catch (err) {
            await this.assessmentRepository.rollbackTransaction(queryRunner);
            throw err;
        }

        const full = await this.assessmentRepository.findByIdWithScores(id, contextUser.companyId);
        return full!.toResponse(full!);
    }

    async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const exists = await this.assessmentRepository.verifyCompanyId(id, contextUser.companyId);
        if (!exists) throw new AppError("Assessment not found or not in your company", "404");
        // Hard-remove so the DB CASCADE clears its scores and the date frees up for re-entry.
        const entity = new Assessment();
        entity.id = id;
        await this.assessmentRepository.invokeDbOperationsWithResponse(entity, Actions.Delete);
    }

    // ── helpers ──

    private async assertEmployeeInCompany(employeeId: string, contextUser: ITokenUser): Promise<void> {
        const ok = await this.employeeRepository.verifyCompanyId(employeeId, contextUser.companyId);
        if (!ok) throw new AppError("Employee not found or not in your company", "404");
    }

    // Loads every referenced skill (tenant-scoped) and enforces the per-skill scale.
    private async loadAndValidateSkills(
        scores: IAssessmentScoreRequest[],
        contextUser: ITokenUser
    ): Promise<Map<string, Skill>> {
        const ids = [...new Set(scores.map((s) => s.skillId))];
        const skills = await this.skillRepository.where({
            where: { id: In(ids) as any, companyId: contextUser.companyId as any, deleted: false } as any,
        });
        const map = new Map(skills.map((s) => [s.id, s]));
        for (const s of scores) {
            const skill = map.get(s.skillId);
            if (!skill) throw new AppError(`Unknown skill: ${s.skillId}`, "400");
            const min = Number(skill.scaleMin);
            const max = Number(skill.scaleMax);
            if (s.score < min || s.score > max) {
                throw new AppError(`Score for "${skill.name}" must be between ${min} and ${max}`, "400");
            }
        }
        return map;
    }

    private buildScore(
        assessmentId: string,
        req: IAssessmentScoreRequest,
        skill: Skill,
        contextUser: ITokenUser
    ): AssessmentScore {
        const sc = new AssessmentScore();
        sc.id = randomUUID();
        sc.createdAt = new Date();
        sc.createdBy = contextUser.name;
        sc.createdById = contextUser.id;
        sc.active = true;
        sc.deleted = false;
        sc.assessmentId = assessmentId;
        sc.skillId = req.skillId;
        sc.score = req.score;
        return sc;
    }
}
