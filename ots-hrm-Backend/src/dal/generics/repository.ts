import { injectable } from 'tsyringe';
import { FindManyOptions, FindOneOptions, FindOptionsRelations, FindOptionsWhere, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { IToResponseBase } from '../../entities/abstractions/to-response-base';
import { CompanyEntityBase } from '../../entities/base-entities/company-entity-base';
import { EntityBase } from '../../entities/base-entities/entity-base';
import { Actions, IDataSourceResponse, IFetchRequest, IFilter, ITokenUser, PagedRequest, RelationLoad } from '../../models';
import { buildQuery, queryOptionsMapper, setSaurceDataResponse } from '../../utility';
import { IRepositoryBase } from '../abstractions/repository-base';

@injectable()
export class GenericRepository<TEntity extends (CompanyEntityBase | EntityBase) & IToResponseBase<TEntity, TResponse>, TResponse> implements IRepositoryBase<TEntity, TResponse> {
    populateRelations: FindOptionsRelations<TEntity> = {};
    constructor(protected readonly repository: Repository<TEntity>){

    }

    async entityCount(options?: FindOptionsWhere<TEntity> | Array<FindOptionsWhere<TEntity>>): Promise<number> {
        return this.repository.count({ where: options });
    }

    async beginTransaction(): Promise<QueryRunner> {
        const queryRunner = this.repository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        return queryRunner;
    }

    async rollbackTransaction(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
    }

    async commitTransaction(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.commitTransaction();
        await queryRunner.release();
    }

    async firstOrDefault(options: FindOneOptions<TEntity>): Promise<TEntity | null> {
        this.loadRelations(options);
        return await this.repository.findOne(options);
    }

    async firstOrDefaultWithResponse(options: FindOneOptions<TEntity>): Promise<TResponse | null> {
        this.loadRelations(options);
        let entity = await this.repository.findOne(options);
        return entity ? entity.toResponse(entity) : null;
    }

    async getOneByQuery(options: {filters: Array<IFilter<TEntity, keyof TEntity>>, relations?: RelationLoad<TEntity>}, getOnlyActive: boolean = false, dontGetDeleted: boolean = true, companyId?: string): Promise<TEntity | null> {
        return await this.repository.findOne({where: queryOptionsMapper(options.filters, getOnlyActive, dontGetDeleted, companyId), relations: {...this.populateRelations, ...(options.relations ?? {})}});
    }

    async getOneByQueryWithResponse(options: {filters: Array<IFilter<TEntity, keyof TEntity>>, relations?: RelationLoad<TEntity>}, getOnlyActive: boolean = false, dontGetDeleted: boolean = true, companyId?: string): Promise<TResponse | null> {
        let entity = await this.repository.findOne({where: queryOptionsMapper(options.filters, getOnlyActive, dontGetDeleted, companyId), relations: {...this.populateRelations, ...(options.relations ?? {})}});
        return entity ? entity.toResponse(entity) : null;
    }

    async getOneByQueryWithFilteredRelations(options: {filters: Array<IFilter<TEntity, keyof TEntity>>, relations?: RelationLoad<TEntity>}, getOnlyActive: boolean = true, dontGetDeleted: boolean = true, companyId?: string): Promise<TResponse | null> {
        const whereConditions = queryOptionsMapper(options.filters, getOnlyActive, dontGetDeleted, companyId, options.relations, true);
        let entity = await this.repository.findOne({
            where: whereConditions[0], 
            relations: {...this.populateRelations, ...(options.relations ?? {})}
        });
        return entity ? entity.toResponse(entity) : null;
    }

    async where(options?: FindManyOptions<TEntity>): Promise<Array<TEntity>> {
        options = options ?? {};
        this.loadRelations(options);
        return await this.repository.find(options);
    }

    async whereWithResponse(options?: FindManyOptions<TEntity>): Promise<Array<TResponse>> {
        options = options ?? {};
        this.loadRelations(options);
        return (await this.repository.find(options)).map(x => x.toResponse(x));
    }

    async getCompanyRecords(companyId: string, options?: FindManyOptions<TEntity>): Promise<Array<TEntity>> {
        const whereClause: FindOptionsWhere<CompanyEntityBase> = { companyId };
        if (options) {
            options = { ...options, where: { ...(options.where as FindOptionsWhere<TEntity>), ...whereClause } }
        }
        else {
            options = { where: whereClause as FindOptionsWhere<TEntity> };
        }
        options = options ?? {};
        this.loadRelations(options);
        return await this.repository.find(options);
    }

    async singleOrDefault(options?: FindOptionsWhere<TEntity>): Promise<TEntity | null> {
        let optionsLoad: FindOneOptions<TEntity> = { where: options };
        this.loadRelations(optionsLoad);
        const entities = await this.repository.find(optionsLoad);
        if (entities.length === 1) return entities[0];
        else if (entities.length > 1) throw new Error('Entity exists more than once.');
        else return null;
    }

    async singleOrDefaultWithResponse(options?: FindOptionsWhere<TEntity>): Promise<TResponse | null> {
        const entity = await this.singleOrDefault(options);
        return entity ? entity.toResponse(entity) : null;
    }

    async findOneById(id: string): Promise<TEntity | null> {
        let options: FindOneOptions<TEntity> = { where: { id: id as any} };
        this.loadRelations(options)
        return await this.repository.findOne(options);
    }

    async findOneByIdWithResponse(id: string): Promise<TResponse | null> {
        let entity = await this.repository.findOneBy({ id: id as any });
        return entity ? entity.toResponse(entity) : null;
    }

    // Company verification methods
    async verifyCompanyId(id: string, companyId: string): Promise<boolean> {
        // Check if entity exists and belongs to the company
        const entity = await this.repository.findOne({
            where: { 
                id: id as any,
                ...(this.isCompanyEntity() ? { companyId: companyId as any } : {})
            }
        });
        return entity !== null;
    }    

    async verifyMultipleCompanyIds(ids: string[], companyId: string): Promise<{ validIds: string[], invalidIds: string[] }> {
        // If this is not a company entity, all IDs are considered valid
        if (!this.isCompanyEntity()) {
            return { validIds: ids, invalidIds: [] };
        }

        // Perform a single query to check all IDs at once for better performance
        const queryBuilder = this.repository.createQueryBuilder('entity');
        const validEntities = await queryBuilder
            .select(['entity.id'])
            .where('entity.id IN (:...ids)', { ids })
            .andWhere('entity.companyId = :companyId', { companyId })
            .getMany();

        const validIds = validEntities.map(entity => entity.id);
        const invalidIds = ids.filter(id => !validIds.includes(id));

        return { validIds, invalidIds };
    }    
    
    async findOneByIdWithCompanyVerification(id: string, companyId?: string): Promise<TEntity | null> {
        // First check if entity exists without company filter
        const entityExists = await this.repository.findOne({ where: { id: id as any } });
        if (!entityExists) {
            throw new Error(`Record with ID ${id} not found`);
        }

        // If this is a company entity and companyId is provided, verify company ownership
        if (this.isCompanyEntity() && companyId) {
            const isValidCompany = await this.verifyCompanyId(id, companyId);
            if (!isValidCompany) {
                throw new Error(`Record with ID ${id} does not belong to your company`);
            }
        }

        const whereConditions: any = { id: id };
        if (this.isCompanyEntity() && companyId) {
            whereConditions.companyId = companyId;
        }

        let options: FindOneOptions<TEntity> = { where: whereConditions };
        this.loadRelations(options);
        return await this.repository.findOne(options);
    }

    async findOneByIdWithResponseAndCompanyVerification(id: string, companyId?: string): Promise<TResponse | null> {
        const entity = await this.findOneByIdWithCompanyVerification(id, companyId);
        return entity ? entity.toResponse(entity) : null;
    }

    private isCompanyEntity(): boolean {
        // Check if the entity extends CompanyEntityBase by checking for companyId property
        const entityMetadata = this.repository.metadata;
        return entityMetadata.columns.some(column => column.propertyName === 'companyId');
    }

    async max(): Promise<TEntity | null> {
        const entities = await this.repository.find();
        return entities.reduce((max, entity) => (max.createdAt > entity.createdAt ? max : entity), entities[0]);
    }

    async getPagedData(fetchRequest: IFetchRequest<TEntity>, getOnlyActive: boolean = false, dontGetDeleted: boolean = true, companyId?: string): Promise<IDataSourceResponse<TResponse>> {
        
        if (!fetchRequest.pagedListRequest) fetchRequest.pagedListRequest = new PagedRequest();
        
        const query = buildQuery(fetchRequest, getOnlyActive, dontGetDeleted, companyId);
        const entities = await this.repository.find(query);
        const totalRecords = await this.entityCount(query.where);
        return setSaurceDataResponse<TEntity, TResponse>(entities, totalRecords, fetchRequest?.pagedListRequest?.pageSize, fetchRequest?.pagedListRequest?.pageNo);
    }

    async getPagedDataWithFilteredRelations(fetchRequest: IFetchRequest<TEntity>, getOnlyActive: boolean = true, dontGetDeleted: boolean = true, companyId?: string): Promise<IDataSourceResponse<TResponse>> {
        if (!fetchRequest.pagedListRequest) fetchRequest.pagedListRequest = new PagedRequest();
        
        const query = buildQuery(fetchRequest, getOnlyActive, dontGetDeleted, companyId, true);
        const entities = await this.repository.find(query);
        const totalRecords = await this.entityCount(query.where);
        return setSaurceDataResponse<TEntity, TResponse>(entities, totalRecords, fetchRequest?.pagedListRequest?.pageSize, fetchRequest?.pagedListRequest?.pageNo);
    }

    async partialUpdate(id: string, partialEntity: QueryDeepPartialEntity<TEntity>, contextUser?: ITokenUser, queryRunner?: QueryRunner, allowOverride: string[] = []): Promise<TEntity> {
        // Verify company ownership if contextUser is provided and this is a company entity.
        // A super admin acting on a company carries that company as contextUser.companyId
        // (set in validateCompanyHeader), so they are verified against the selected company too.
        if ( contextUser && this.isCompanyEntity()) {
            const isValidCompanyId = await this.verifyCompanyId(id, contextUser.companyId);
            if (!isValidCompanyId) {
                throw new Error(`Record with ID ${id} not found or does not belong to your company`);
            }
        }

        // Defense-in-depth against mass assignment: never allow these security /
        // system-managed columns to be set through the generic update path,
        // regardless of what a request body (or a mis-scoped schema) contains.
        // Credential, tenant, lifecycle and audit columns are managed elsewhere.
        const BLOCKED_UPDATE_COLUMNS = [
            'id', 'passwordHash', 'companyId', 'active', 'deleted',
            'isEmailVerified', 'isPhoneVerified',
            'googleAccessToken', 'googleRefreshToken',
            'createdAt', 'createdBy', 'createdById',
        ];
        const sanitizedPartial = { ...(partialEntity as Record<string, unknown>) };
        for (const col of BLOCKED_UPDATE_COLUMNS) {
            // allowOverride is for values the caller's own business logic computed (e.g.
            // Employee.onStatusChange deriving `active` from a status transition) — not for
            // passing untrusted request-body fields through, which is exactly what this
            // blocklist exists to stop.
            if (allowOverride.includes(col)) continue;
            delete sanitizedPartial[col];
        }

        // try {
            const updateData = contextUser ? {
                ...(sanitizedPartial as QueryDeepPartialEntity<TEntity>),
                modifiedAt: new Date(),
                modifiedBy: contextUser.name,
                modifiedById: contextUser.id
            } : (sanitizedPartial as QueryDeepPartialEntity<TEntity>);

            let result;
            if (queryRunner) {
                result = await queryRunner.manager.update(this.repository.target, id, updateData);
            } else {
                result = await this.repository.update(id, updateData);
            }
            let updatedRecord = await this.findOneById(id);
            if(result.affected !== 1 || !updatedRecord) throw new Error(`An error occurred while updating`);
            return updatedRecord;
        // } catch (error) {
        //     console.error(`Error updating entity with ID ${id}:`, error);
        //     throw new Error(`An error occurred while updating`);
        // }
    }

    async invokeDbOperations(entity: TEntity, action: Actions, queryRunner?: QueryRunner): Promise<TEntity> {
        switch (action) {
            case Actions.Add:
                return await this.add(entity, queryRunner);
            case Actions.Delete:
                return await this.deleteRecord(entity, queryRunner);
            case Actions.Update:
                return await this.updateEntity(entity, queryRunner);
            default:
                return entity;
        }
    }

    async invokeDbOperationsWithResponse(entity: TEntity, action: Actions, queryRunner?: QueryRunner): Promise<TResponse> {
        return (await this.invokeDbOperations(entity, action, queryRunner)).toResponse();
    }

    async invokeDbOperationsRange(entities: TEntity[], action: Actions, queryRunner?: QueryRunner): Promise<TEntity[]> {
        switch (action) {
            case Actions.Add:
                return this.addRange(entities, queryRunner);
            case Actions.Delete:
                return this.deleteRange(entities, queryRunner);
            case Actions.Update:
                return this.updateRange(entities, queryRunner);
            default:
                return entities;
        }
    }

    async invokeDbOperationsRangeWithResponse(entities: TEntity[], action: Actions, queryRunner?: QueryRunner): Promise<TResponse[]> {
        return (await this.invokeDbOperationsRange(entities, action, queryRunner)).map(x => x.toResponse())
    }

    protected async add(entity: TEntity, queryRunner?: QueryRunner): Promise<TEntity> {
        if(queryRunner) return await queryRunner.manager.save(entity);
        return await this.repository.save(entity);
    }

    protected async addRange(entities: TEntity[], queryRunner?: QueryRunner): Promise<TEntity[]> {
        if(queryRunner) return await queryRunner.manager.save(entities);
        return await this.repository.save(entities);
    }

    protected async updateEntity(entity: TEntity, queryRunner?: QueryRunner): Promise<TEntity> {
        if(queryRunner) await queryRunner.manager.save(entity);
        else await this.repository.save(entity);
        return entity;
    }

    protected async updateRange(entities: TEntity[], queryRunner?: QueryRunner): Promise<TEntity[]> {
        if(queryRunner) return await queryRunner.manager.save(entities);
        return await this.repository.save(entities);
    }

    private async deleteRecord(entity: TEntity, queryRunner?: QueryRunner): Promise<TEntity> {
        if(queryRunner) {
            await queryRunner.manager.remove(entity);
        } else {
            await this.repository.remove(entity);
        }
        return entity;
    }

    protected async deleteRange(entities: TEntity[], queryRunner?: QueryRunner): Promise<TEntity[]> {
        if(queryRunner) {
            await queryRunner.manager.remove(entities);
        } else {
            await this.repository.remove(entities);
        }
        return entities;
    }

    protected loadRelations(options: FindOneOptions<TEntity> | FindManyOptions<TEntity>){
        if(Object.entries(this.populateRelations).length){
            options.relations = options.relations ? {...options.relations, ...this.populateRelations} : this.populateRelations;
        }
    }

    queryBuilder(alias: string): SelectQueryBuilder<TEntity> {
        return this.repository.createQueryBuilder(alias);
    }

}
