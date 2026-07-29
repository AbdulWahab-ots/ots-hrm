import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { IToDoRequest, IToDoResponse, ITokenUser } from "../models";
import { IToResponseBase } from "./abstractions/to-response-base";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { User } from "./user";

@Entity('ToDo')
export class ToDo extends CompanyEntityBase implements IToResponseBase<ToDo, IToDoResponse> {
    
    @Column({ type: 'text'})
    todo!: string;

    @Column({ type: 'text'})
    details!: string;

    @Column({ type: 'timestamp'})
    dueDate!: Date;

    @Column({ type: 'boolean'})
    completed!: boolean;

    @Column()
    userId!: string;

    @ManyToOne(() => User, (user) => user, {nullable: false, eager: true})
    @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
    user!: User
    
    toResponse(entity?: ToDo): IToDoResponse {
       
        if(!entity) entity = this;

        return {
            ...super.toCompanyResponseBase(entity),
            todo: entity.todo,
            details: entity.details,
            completed: entity.completed,
            dueDate: entity.dueDate,
            userId: entity.userId,
            user: entity.user.toResponse(entity.user)
        }
    }

    toEntity = (entityRequest: IToDoRequest, id?: string, contextUser?: ITokenUser): ToDo => {
        this.todo = entityRequest.todo;
        this.details = entityRequest.details;
        this.dueDate = entityRequest.dueDate;
        this.userId = entityRequest.userId;
        this.completed = entityRequest.completed;
        let user = new User();
        user.id = entityRequest.userId;
        this.user = user;

        if(contextUser) super.toCompanyEntity(contextUser, id);
        
        return this;
    }
}