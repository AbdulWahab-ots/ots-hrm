import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { IAssessmentRequest, IAssessmentResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Employee } from "./employee";
import { AssessmentScore } from "./assessment-score";

@Entity('Assessment')
// One assessment per employee per date (editing that date updates it).
@Index(['employeeId', 'assessedOn'], { unique: true, where: '"deleted" = false' })
export class Assessment extends CompanyEntityBase implements IToResponseBase<Assessment, IAssessmentResponse> {

    @Column({ type: 'uuid', nullable: false })
    employeeId!: string;

    @Column({ type: 'date', nullable: false })
    assessedOn!: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    assessor?: string;

    @Column({ type: 'text', nullable: true })
    note?: string;

    @ManyToOne(() => Employee, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId', referencedColumnName: 'id' })
    employee?: Employee;

    @OneToMany(() => AssessmentScore, (s) => s.assessment, { cascade: true })
    scores?: AssessmentScore[];

    // Weighted overall as a percentage of each skill's max scale (spec section 3).
    private computeOverall(scores?: AssessmentScore[]): number {
        const list = (scores || []).filter((s) => s.skill);
        if (!list.length) return 0;
        let weighted = 0;
        let weightSum = 0;
        for (const s of list) {
            const max = Number(s.skill!.scaleMax) || 1;
            const w = Number(s.skill!.weight) || 1;
            weighted += (Number(s.score) / max) * w;
            weightSum += w;
        }
        if (weightSum === 0) return 0;
        return Math.round((weighted / weightSum) * 100 * 100) / 100;
    }

    toResponse(entity?: Assessment): IAssessmentResponse {
        if (!entity) entity = this;
        return {
            ...super.toCompanyResponseBase(entity),
            employeeId: entity.employeeId,
            assessedOn: entity.assessedOn,
            assessor: entity.assessor,
            note: entity.note,
            scores: (entity.scores || []).map((s) => s.toResponse(s)),
            overall: this.computeOverall(entity.scores),
        };
    }

    // Scores are attached separately by the service (transactional create/upsert),
    // so toEntity only maps the assessment's own fields.
    toEntity = (req: IAssessmentRequest, id?: string, contextUser?: ITokenUser): Assessment => {
        this.employeeId = req.employeeId;
        this.assessedOn = req.assessedOn ? new Date(req.assessedOn) : this.assessedOn;
        this.assessor = req.assessor;
        this.note = req.note;
        if (contextUser) super.toCompanyEntity(contextUser, id);
        return this;
    }
}
