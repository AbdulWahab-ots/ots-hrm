import { randomUUID } from "crypto";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from "typeorm";
import { EmptyGuid } from "../constants";
import { IPrivilegeResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { EntityBase } from "./base-entities/entity-base";
import { Role } from "./role";

@Entity('Privilege')
export class Privilege extends EntityBase implements IToResponseBase<Privilege, IPrivilegeResponse> {

    @Column({ type: 'text', unique: true})
    name!: string;

    @Column({ type: 'text', unique: true})
    code!: string;

    @Column({ nullable: false})
    module!: string;

    @ManyToMany(() => Role, (role) => role.privileges)
    @JoinTable({ 
        name: 'Role_Privilege', 
        joinColumn: {name: 'privilegeId', referencedColumnName: 'id'}, 
        inverseJoinColumn: {name: 'roleId', referencedColumnName: 'id'}
    })
    roles!: Array<Role>;

    newInstanceToAdd(name: string, code: string): Privilege {
        this.id = randomUUID();
        this.createdAt = new Date();
        this.createdBy = "Super Admin";
        this.createdById = EmptyGuid;
        this.active = true;
        this.deleted = false;
        this.name = name;
        this.code = code;
        this.roles = [];
        return this;
    }

    toEntity(requestEntity: Privilege, id?: string, contextUser?: ITokenUser){
        return requestEntity;
    }

    toResponse(entity?: Privilege): IPrivilegeResponse {

        if(!entity) entity = this;

        return {
            ...super.toResponseBase(entity),
            name: entity.name,
            code: entity.code,
            module: entity.module,
        }
    }
}