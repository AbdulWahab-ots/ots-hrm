import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { IAssessmentScoreResponse } from "../models";
import { EntityBase } from "./base-entities/entity-base";
import { Skill } from "./skill";
import { Assessment } from "./assessment";

@Entity('AssessmentScore')
export class AssessmentScore extends EntityBase {

    @Column({ type: 'uuid', nullable: false })
    assessmentId!: string;

    @Column({ type: 'uuid', nullable: false })
    skillId!: string;

    @Column({ type: 'numeric', precision: 6, scale: 2, nullable: false })
    score!: number;

    @ManyToOne(() => Assessment, (a) => a.scores, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assessmentId', referencedColumnName: 'id' })
    assessment?: Assessment;

    @ManyToOne(() => Skill, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'skillId', referencedColumnName: 'id' })
    skill?: Skill;

    toResponse(entity?: AssessmentScore): IAssessmentScoreResponse {
        if (!entity) entity = this;
        return {
            id: entity.id,
            assessmentId: entity.assessmentId,
            skillId: entity.skillId,
            score: Number(entity.score),
            skill: entity.skill
                ? {
                      id: entity.skill.id,
                      name: entity.skill.name,
                      key: entity.skill.key,
                      scaleMin: Number(entity.skill.scaleMin),
                      scaleMax: Number(entity.skill.scaleMax),
                      weight: Number(entity.skill.weight),
                  }
                : undefined,
        };
    }
}
