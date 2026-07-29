import { Column, Entity, Index } from "typeorm";
import { EntityBase } from "./base-entities/entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { IMasterEnumRequest, IMasterEnumResponse } from "../models";


// Master Enum Entity
@Entity('MasterEnum')
@Index(['moduleType', 'enumKey'], { unique: true })
export class MasterEnum extends EntityBase implements IToResponseBase<MasterEnum, IMasterEnumResponse> {

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false
    })
    moduleType!: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false
    })
    enumKey!: string;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false
    })
    enumValue!: string;

    @Column({
        type: 'text',
        nullable: true
    })
    description?: string;

    @Column({
        type: 'boolean',
        default: true
    })
    isActive!: boolean;

    @Column({
        type: 'int',
        default: 0
    })
    sortOrder!: number;

    toEntity(request: IMasterEnumRequest, id?: string, contextUser?: any): MasterEnum {
        this.moduleType = request.moduleType;
        this.enumKey = request.enumKey;
        this.enumValue = request.enumValue;
        this.description = request.description;
        this.sortOrder = request.sortOrder ?? 0;

        if (contextUser && !id) this.toBaseEntiy(contextUser);

        return this;
    }

    toResponse(entity?: MasterEnum): IMasterEnumResponse {
        if (!entity) entity = this;

        return {
            ...this.toResponseBase(entity),
            moduleType: entity.moduleType,
            enumKey: entity.enumKey,
            enumValue: entity.enumValue,
            description: entity.description,
            sortOrder: entity.sortOrder,
        };
    }
}