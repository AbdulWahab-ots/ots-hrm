import { Column, Entity, OneToMany, Unique } from "typeorm";
import { ICompanyRequest, ICompanyResponse } from "../models";
import { ITokenUser } from "../models/inerfaces/tokenUser";
import { IToResponseBase } from "./abstractions/to-response-base";
import { EntityBase } from "./base-entities/entity-base";
import { User } from "./user";

@Entity('Company')
export class Company extends EntityBase implements IToResponseBase<Company, ICompanyResponse> {

    @Column({ type: 'text', unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    phoneNo?: string;

    @Column({ type: 'text', unique: true })
    email!: string;

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({ type: 'text', nullable: true })
    temporaryAddress?: string;

    @Column({ type: 'int', nullable: true })
    zipCode?: number;

    @Column({ type: 'text', nullable: true })
    country?: string;

    @Column({ type: 'text', nullable: true })
    state?: string;

    @Column({ type: 'text', nullable: true })
    city?: string;

    @Column({ type: 'text', nullable: true })
    logoUrl?: string;

    // Marks the internal system/super-admin company. It can only be edited, never deleted,
    // and no admins/employees can be added to it.
    @Column({ type: 'boolean', default: false })
    isSystemCompany!: boolean;

    // Relationship to get all users of this company
    @OneToMany(() => User, user => user.company, { eager: false })
    users?: User[];

    toResponse(entity?: Company): ICompanyResponse {

        if(!entity) entity = this;

        return {
            ...super.toResponseBase(entity),
            name: entity.name,
            phoneNo: entity.phoneNo,
            email: entity.email,
            address: entity.address,
            temporaryAddress: entity.temporaryAddress,
            zipCode: entity.zipCode,
            country: entity.country,
            state: entity.state,
            city: entity.city,
            logoUrl: entity.logoUrl,
            isSystemCompany: entity.isSystemCompany,
            users: entity.users ? entity.users.map(user => user.toResponse()) : undefined
        }
    }

    toEntity = (requestEntity: ICompanyRequest, id?: string, contextUser?: ITokenUser): Company => {
        this.name = requestEntity.name;
        this.phoneNo = requestEntity.phoneNo;
        this.email = requestEntity.email;
        this.address = requestEntity.address;
        this.temporaryAddress = requestEntity.temporaryAddress;
        this.zipCode = requestEntity.zipCode;
        this.country = requestEntity.country;
        this.state = requestEntity.state;
        this.city = requestEntity.city;
        this.logoUrl = requestEntity.logoUrl;

        if(contextUser) super.toBaseEntiy(contextUser, id)

        return this;
    }
}