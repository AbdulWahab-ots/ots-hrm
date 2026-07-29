import { randomUUID } from "crypto";
import { User } from "./user";
import { IActivityLogResponse, ITokenUser } from "../models";
import { logDetailGenerator } from "../utility/log-detail-generator";
import { FastifyRequest } from 'fastify'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { requestPlatformExtract, tryParse } from "../utility";
import { sanitizeBody, sanitizeHeaders } from "../utility/log-sanitizer";
import { dataSource } from "../dal/db/db-source";
import { CompanyEntityBase } from "./base-entities/company-entity-base";
import { IToResponseBase } from "./abstractions/to-response-base";
import { EmptyGuid } from "../constants";
import { EntityBase } from "./base-entities/entity-base";
import { Company } from "./company";
import { error } from "console";

@Entity('ActivityLog')
export class ActivityLog extends EntityBase implements IToResponseBase<ActivityLog, IActivityLogResponse>{
    
    @Column({type: 'text'})
    logDetail!: string;

    @Column({type: 'text'})
    url!: string;
    
    @Column({type: 'text'})
    model!: string;

    @Column({type: 'text'})
    method!: 'get' | 'put' | 'delete' | 'post' | string;
    
    @Column({type: 'text'})
    status!: 'success' | 'error';
    
    @Column({type: 'text', nullable: true})
    platform?: string;
    
    @Column({type: 'text', nullable: true})
    language?: string;
    
    @Column({type: 'text', nullable: true})
    ipAddress?: string;
    
    @Column({type: 'json', nullable: true})
    params?: string;
    
    @Column({type: 'json', nullable: true})
    queryParams?: string; 
    
    @Column({type: 'json', nullable: true})
    body?: string;
    
    @Column({type: 'json', nullable: true})
    headers?: string; 
    
    @Column({type: 'text', nullable: true})
    errorDetail?: string;

    @Column({ type: 'uuid' ,nullable: true})
    companyId?: string;
    
    @ManyToOne(() => Company, { nullable: true })
    @JoinColumn({ name: "companyId", referencedColumnName: "id" })
    company?: Company;

    
    logStart(url: string, method: 'get' | 'put' | 'delete' | 'post' | string, request: FastifyRequest, contextUser?: ITokenUser): ActivityLog {
        this.id = randomUUID();
        this.createdAt = new Date();

        if(contextUser){
            this.createdById = contextUser.id;
            this.createdBy = contextUser.name;
        }

        this.url = url;
        let {model, detail} = logDetailGenerator(url, method);
        this.logDetail = detail;
        this.model = model;
        this.ipAddress = request.headers['x-forwarded-for'] ? request.headers['x-forwarded-for'].toString() : request.ip?.toString() ?? '';
        this.platform = requestPlatformExtract(request.headers['user-agent']);
        
        this.method = method;
        this.body = sanitizeBody(request.body);
        this.params = request.params && Object.keys(request.params).length ? JSON.stringify(request.params) : undefined;
        this.queryParams = request.query && Object.keys(request.query).length ? JSON.stringify(request.query) : undefined;
        this.headers = sanitizeHeaders(request.headers);
        return this
    }

    addUserDetails(contextUser: ITokenUser){
        this.createdBy = contextUser.name;
        this.createdById = contextUser.id;
        this.companyId = contextUser.companyId;
        return this
    }

    async logEnd(status: 'success' | 'error', errorDetail?: string, request: FastifyRequest | undefined = undefined): Promise<ActivityLog> {
        this.status = status;
        this.errorDetail = errorDetail;
        
        if(!this.createdById || !this.companyId){
            this.createdBy = 'System';
            this.createdById = EmptyGuid;
        }
        if(request && request.body) {
            this.body = sanitizeBody(request.body);
        }

        const activityLogRepo = dataSource.getRepository(ActivityLog)
        try{

            return await activityLogRepo.save(this);
        }catch(err){
            // Audit logging is a best-effort side effect: if persisting the log fails
            // (e.g. a stale session referencing a companyId that no longer exists, or
            // any DB hiccup), it must NOT turn an otherwise successful API request into
            // a 500. Log the failure and return without rethrowing.
            error("Failed to persist activity log:", err)
            return this;
        }
    }

    toResponse(entity?: ActivityLog): IActivityLogResponse {

        if(!entity) entity = this;

        return {
            ...this.toResponseBase(entity),
            logDetail: entity.logDetail,
            url: entity.url,
            model: entity.model,
            method: entity.method,
            status: entity.status,
            platform: entity.platform,
            language: entity.language,
            ipAddress: entity.ipAddress,
            params: entity.params ? JSON.parse(entity.params) : undefined,
            queryParams: entity.queryParams ? JSON.parse(entity.queryParams) : undefined,
            body: entity.body ? tryParse(entity.body) : undefined, 
            headers: entity.headers ? tryParse(entity.headers) : undefined,
            errorDetail: entity.errorDetail
        }
    }

}