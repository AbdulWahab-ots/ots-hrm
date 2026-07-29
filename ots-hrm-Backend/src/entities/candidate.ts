import { Column, Entity } from "typeorm";
import { ICandidateRequest, ICandidateResponse, ITokenUser, CandidateStage } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";

@Entity('Candidate')
export class Candidate extends CompanyEntityBase implements IToResponseBase<Candidate, ICandidateResponse> {

    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 255, default: 'Unspecified role' })
    role!: string;

    @Column({ type: 'enum', enum: CandidateStage, default: CandidateStage.APPLIED })
    stage!: CandidateStage;

    @Column({ type: 'varchar', length: 255, nullable: true })
    owner?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    source?: string;

    @Column({ type: 'date', nullable: true })
    date?: Date;

    @Column({ type: 'text', nullable: true })
    note?: string;

    // Candidate's current/previous employer. Named `currentCompany` (not `company`)
    // because `company` is the tenant relation on CompanyEntityBase.
    @Column({ type: 'varchar', length: 255, nullable: true })
    currentCompany?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    city?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    contact?: string;

    // Salaries are kept as free strings (values like "PKR 180,000").
    @Column({ type: 'varchar', length: 100, nullable: true })
    currentSalary?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    expectedSalary?: string;

    @Column({ type: 'int', nullable: true })
    score?: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    notice?: string;

    toResponse(entity?: Candidate): ICandidateResponse {
        if (!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            role: entity.role,
            stage: entity.stage,
            owner: entity.owner,
            source: entity.source,
            date: entity.date,
            note: entity.note,
            currentCompany: entity.currentCompany,
            city: entity.city,
            email: entity.email,
            contact: entity.contact,
            currentSalary: entity.currentSalary,
            expectedSalary: entity.expectedSalary,
            score: entity.score,
            notice: entity.notice,
        };
    }

    toEntity = (entityRequest: ICandidateRequest, id?: string, contextUser?: ITokenUser): Candidate => {
        this.name = entityRequest.name;
        this.role = entityRequest.role?.trim() || 'Unspecified role';
        this.stage = entityRequest.stage ?? CandidateStage.APPLIED;
        this.owner = entityRequest.owner;
        this.source = entityRequest.source;
        this.date = entityRequest.date ? new Date(entityRequest.date) : undefined;
        this.note = entityRequest.note;
        this.currentCompany = entityRequest.currentCompany;
        this.city = entityRequest.city;
        this.email = entityRequest.email;
        this.contact = entityRequest.contact;
        this.currentSalary = entityRequest.currentSalary;
        this.expectedSalary = entityRequest.expectedSalary;
        // Coerce score to an integer, or leave undefined/null.
        this.score = entityRequest.score === undefined || entityRequest.score === null
            ? undefined
            : Math.trunc(Number(entityRequest.score));
        this.notice = entityRequest.notice;

        if (contextUser) super.toCompanyEntity(contextUser, id);

        return this;
    }
}
