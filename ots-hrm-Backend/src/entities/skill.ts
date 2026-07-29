import { Column, Entity, Index } from "typeorm";
import { ISkillRequest, ISkillResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { generateCodeFromName } from "../utility";

@Entity('Skill')
// Unique slug per company among non-deleted rows.
@Index(['companyId', 'key'], { unique: true, where: '"deleted" = false' })
export class Skill extends CompanyEntityBase implements IToResponseBase<Skill, ISkillResponse> {

    @Column({ type: 'varchar', length: 120, nullable: false })
    name!: string;

    // slug, e.g. "vocabulary"
    @Column({ type: 'varchar', length: 120, nullable: false })
    key!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    scaleMin!: number;

    @Column({ type: 'int', default: 10 })
    scaleMax!: number;

    // optional weight for a weighted overall score
    @Column({ type: 'numeric', precision: 6, scale: 2, default: 1 })
    weight!: number;

    @Column({ type: 'int', nullable: true })
    sortOrder?: number;

    toResponse(entity?: Skill): ISkillResponse {
        if (!entity) entity = this;
        return {
            ...super.toCompanyResponseBase(entity),
            name: entity.name,
            key: entity.key,
            description: entity.description,
            scaleMin: Number(entity.scaleMin),
            scaleMax: Number(entity.scaleMax),
            weight: Number(entity.weight),
            sortOrder: entity.sortOrder,
        };
    }

    toEntity = (req: ISkillRequest, id?: string, contextUser?: ITokenUser): Skill => {
        this.name = req.name;
        this.key = req.key?.trim() || generateCodeFromName(req.name);
        this.description = req.description;
        this.scaleMin = req.scaleMin ?? 0;
        this.scaleMax = req.scaleMax ?? 10;
        this.weight = req.weight ?? 1;
        this.sortOrder = req.sortOrder;
        if (typeof req.active === 'boolean') this.active = req.active;

        if (contextUser) super.toCompanyEntity(contextUser, id);
        return this;
    }
}
