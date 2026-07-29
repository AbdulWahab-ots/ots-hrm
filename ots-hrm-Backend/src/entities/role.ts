import { BeforeInsert, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, Unique } from "typeorm";
import { IRoleRequest, IRoleResponse } from "../models";
import { ITokenUser } from "../models/inerfaces/tokenUser";
import { IToResponseBase } from "./abstractions/to-response-base";
import { Company } from "./company";
import { EntityBase } from "./base-entities/entity-base";
import { Privilege } from "./privilege";
import { User } from "./user";
import { generateCodeFromName, sanitizeString } from "../utility";

@Entity('Role')
@Unique(["companyId", "code"])
@Unique(["companyId", "name"])
export class Role extends EntityBase implements IToResponseBase<Role, IRoleResponse> {
    @Column({ nullable: false, type: 'text'})
    name!: string;

    @Column({ nullable: false, type: 'text'})
    code!: string;

    @Column({ nullable: false, default: true })
    isEditable!: boolean;

    @Column({ nullable: true })
    companyId?: string;

    @ManyToOne(() => Company, {nullable: true, onDelete: 'CASCADE'})
    @JoinColumn({name: 'companyId', referencedColumnName: 'id'})
    company!: Company | undefined

    @BeforeInsert()
    beforeInsert() {
        // Generate code if not provided
        if (!this.code && this.name) {
            this.name = sanitizeString(this.name);
            this.code = generateCodeFromName(this.name);
        }
    }
    
    @ManyToMany(() => Privilege, (privilege) => privilege.roles, {cascade: true, eager: true})
    @JoinTable({
        name: 'Role_Privilege', 
        joinColumn: {name: 'roleId', referencedColumnName: 'id'}, 
        inverseJoinColumn: {name: 'privilegeId', referencedColumnName: 'id'}
    })
    privileges!: Array<Privilege>;

    @OneToMany(() => User, (user: User) => user.role)
    users!: Array<User>;
    
    toResponse(entity?: Role): IRoleResponse {

        if(!entity) entity = this;

        return {
            ...super.toResponseBase(entity),
            name: entity.name,
            code: entity.code,
            privileges: (this.privileges || []).map(prv => prv.toResponse())
        };
    }

    toEntity = (entityRequest: IRoleRequest, id?: string, contextUser?: ITokenUser): Role => {
        this.name = entityRequest.name;
        this.code = entityRequest.code;
        this.companyId = contextUser?.companyId;

        if(this.companyId) {
            let company = new Company;
            company.id = this.companyId;
            this.company = company
        }
        if(contextUser) super.toBaseEntiy(contextUser, id);

        this.privileges = entityRequest.privilegeIds.map(prv => {
            let privilege = new Privilege();
            privilege.id = prv;
            return privilege;
        });

        return this;
    }

}