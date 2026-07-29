import { Column, Entity, JoinColumn, ManyToOne, OneToOne, OneToMany, Unique } from "typeorm";
import { Gender, IUserRequest, IUserResponse, UserStatus } from "../models";
import { ITokenUser } from "../models/inerfaces/tokenUser";
import { DefaultRoles } from "../constants";
import { IToResponseBase } from "./abstractions/to-response-base";
import { Role } from "./role";
import { text } from "stream/consumers";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { Employee } from "./employee";
import { Company } from "./company";
import { EmployeeBenefit } from "./employee-benefit";
@Entity('User')
@Unique(['companyId', 'userName'])
export class User extends CompanyEntityBase implements IToResponseBase<User, IUserResponse> {

    @Column({ type: 'text' })
    userName!: string;

    @Column({ type: 'text', unique: true, nullable: false })
    email!: string;

    @Column({ type: 'text', nullable: true})
    passwordHash?: string;

    @Column({ type: 'text' })
    firstName!: string;

    @Column({ type: 'text', nullable: true })
    middleName?: string;

    @Column({ type: 'text' })
    lastName!: string;

    @Column({type: 'text', default: Gender.Others, nullable: false})
    gender!: Gender;

    @Column({ type: 'text', nullable: true })
    pictureUrl?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateOfBirth?: Date;

    @Column({ type: 'int', default: UserStatus.Offline })
    status!: UserStatus;

    @Column({ type: 'timestamp', nullable: true})
    lastLogin?: Date;

    @Column({ type: 'timestamp', nullable: true })
    lastOnline?: Date;

    @Column({type: "uuid"})
    roleId!: string;

    @Column({type: "text", nullable: true})
    isEmailVerified?: boolean;

    @Column({type: "text", nullable: true})
    isPhoneVerified?: boolean;

    @Column({type: "text", nullable: true})
    phoneNumber?: string;

    @Column({type: "boolean", default: false})
    isGoogleSignup!: boolean;

    @Column({type: "text", nullable: true})
    googleAccessToken?: string;

    @Column({type: "text", nullable: true})
    googleRefreshToken?: string;

    @ManyToOne(() => Role, (role) => role, {cascade: true, nullable: false})
    @JoinColumn({ name: 'roleId', referencedColumnName: 'id' })
    role!: Role

    @OneToOne(() => Employee, employee => employee.user, { eager: false, nullable: true })
    employee?: Employee;

    // Employee Benefits Relationship (One-to-Many)
    @OneToMany(() => EmployeeBenefit, employeeBenefit => employeeBenefit.user, {
        cascade: false,
        eager: false // Load only when needed
    })
    employeeBenefits?: EmployeeBenefit[];

    toResponse(entity?: User): IUserResponse {

        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            userName: entity.userName,
            email: entity.email,
            firstName: entity.firstName,
            middleName: entity.middleName,
            lastName: entity.lastName,
            pictureUrl: entity.pictureUrl,
            dateOfBirth: entity.dateOfBirth,
            gender: entity.gender,
            status: entity.status,
            lastLogin: entity.lastLogin,
            lastOnline: entity.lastOnline,
            roleId: entity.roleId,
            isGoogleSignup: entity.isGoogleSignup,
            isEmailVerified: entity.isEmailVerified,
            isPhoneVerified: entity.isPhoneVerified,
            phoneNumber: entity.phoneNumber,
            role: entity.role ? entity.role.toResponse() : undefined,
            employee: entity.employee ? entity.employee.toResponse() : undefined,
            employeeBenefits: entity.employeeBenefits ? entity.employeeBenefits.map(benefit => benefit.toResponse()) : undefined
        }    
    }

    
    toEntity = (requestEntity: IUserRequest, id?: string, contextUser?: ITokenUser): User => {
        this.userName = requestEntity.userName;
        this.email = requestEntity.email;
        this.firstName = requestEntity.firstName;
        this.middleName = requestEntity.middleName;
        this.lastName = requestEntity.lastName;
        this.dateOfBirth = requestEntity.dateOfBirth;
        this.roleId = requestEntity.roleId;
        this.pictureUrl = requestEntity.pictureUrl;
        this.gender = requestEntity.gender || Gender.Others;
        this.isGoogleSignup = requestEntity.isGoogleSignup;
        this.googleAccessToken = requestEntity.googleAccessToken;
        this.googleRefreshToken = requestEntity.googleRefreshToken;
        this.isEmailVerified = requestEntity.isEmailVerified;
        this.isPhoneVerified = requestEntity.isPhoneVerified;
        this.phoneNumber = requestEntity.phoneNumber;

        if(contextUser) super.toCompanyEntity(contextUser, id);

        // Only a super admin may target another company via the request body; for everyone
        // else companyId stays the caller's own (set above), so a request can't inject it.
        if (requestEntity.companyId && contextUser?.role === DefaultRoles.SuperAdmin) {
            this.companyId = requestEntity.companyId;
            // Update the company reference as well
            this.company = new Company();
            this.company.id = requestEntity.companyId;
        }

        return this;
    }



}