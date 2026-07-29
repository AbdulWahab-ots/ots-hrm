import { Column, PrimaryColumn } from "typeorm";
import { IResponseBase } from "../../models/inerfaces/response/response-base";
import { ITokenUser } from "../../models";
import { randomUUID } from "crypto";

export abstract class EntityBase {
    @PrimaryColumn({type: 'uuid'})
    id!: string;

    @Column({ type: 'timestamp'})
    createdAt!: Date;

    @Column({ type: 'boolean', default: 1})
    active!: boolean;

    @Column({ type: 'text'})
    createdBy!: string;

    @Column({ type: 'uuid'})
    createdById!: string;

    @Column({ type: 'timestamp', default: null, nullable: true})
    modifiedAt?: Date;

    @Column({ type: 'text', default: null, nullable: true})
    modifiedBy?: string;

    @Column({ type: 'uuid', default: null, nullable: true})
    modifiedById?: string;

    @Column({ type: 'boolean', default: 0})
    deleted!: boolean; 

    protected toBaseEntiy (contextUser: ITokenUser, id?: string): EntityBase {
        this.active = true;
        this.deleted = false;
    if (!id){
        this.id = randomUUID();
        this.createdAt = new Date();
        this.createdBy = contextUser.name;
        this.createdById = contextUser.id;
    } else {
        this.modifiedAt = new Date();
        this.modifiedBy = contextUser.name;
        this.modifiedById = contextUser.id;
    }
        return this
    }
    
    protected toResponseBase<T extends EntityBase>(entity: T): IResponseBase {
        return {
            id: entity.id,
            active: entity.active,
            createdAt: entity.createdAt,
            createdBy: entity.createdBy,
            createdById: entity.createdById,
            modifiedAt: entity.modifiedAt,
            modifiedBy: entity.modifiedBy,
            modifiedById: entity.modifiedById,
        }
    }
}