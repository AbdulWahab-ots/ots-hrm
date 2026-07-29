import { EntityManager, FindManyOptions, FindOneOptions, FindOptionsRelations, FindOptionsWhere, QueryRunner, SelectQueryBuilder } from "typeorm";
import { Actions, IDataSourceResponse, IFetchRequest, IFilter, ITokenUser, RelationLoad } from "../../models";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
import { CompanyEntityBase } from '../../entities/base-entities/company-entity-base';
import { EntityBase } from "../../entities";

export interface IRepositoryBase<TEntity extends (CompanyEntityBase | EntityBase), TResponse> {
    // Properties
    populateRelations: FindOptionsRelations<TEntity>;

    // Query Methods
    entityCount(options?: FindOptionsWhere<TEntity> | Array<FindOptionsWhere<TEntity>>): Promise<number>;
    firstOrDefault(options: FindOneOptions<TEntity>): Promise<TEntity | null>;
    firstOrDefaultWithResponse(options: FindOneOptions<TEntity>): Promise<TResponse | null>;
    getOneByQuery(
        options: {filters: Array<IFilter<TEntity, keyof TEntity>>, relations?: RelationLoad<TEntity>}, 
        getOnlyActive?: boolean, 
        dontGetDeleted?: boolean, 
        companyId?: string
    ): Promise<TEntity | null>;
    getOneByQueryWithResponse(
        options: {filters: Array<IFilter<TEntity, keyof TEntity>>, relations?: RelationLoad<TEntity>}, 
        getOnlyActive?: boolean, 
        dontGetDeleted?: boolean, 
        companyId?: string
    ): Promise<TResponse | null>;
    getOneByQueryWithFilteredRelations(
        options: {filters: Array<IFilter<TEntity, keyof TEntity>>, relations?: RelationLoad<TEntity>}, 
        getOnlyActive?: boolean, 
        dontGetDeleted?: boolean, 
        companyId?: string
    ): Promise<TResponse | null>;
    where(options?: FindManyOptions<TEntity>): Promise<Array<TEntity>>;
    whereWithResponse(options?: FindManyOptions<TEntity>): Promise<Array<TResponse>>;
    getCompanyRecords(companyId: string, options?: FindManyOptions<TEntity>): Promise<Array<TEntity>>;
    singleOrDefault(options?: FindOptionsWhere<TEntity>): Promise<TEntity | null>;
    singleOrDefaultWithResponse(options?: FindOptionsWhere<TEntity>): Promise<TResponse | null>;
    findOneById(id: string): Promise<TEntity | null>;
    findOneByIdWithResponse(id: string): Promise<TResponse | null>;
    // Company verification methods
    verifyCompanyId(id: string, companyId: string): Promise<boolean>;
    verifyMultipleCompanyIds(ids: string[], companyId: string): Promise<{ validIds: string[], invalidIds: string[] }>;
    findOneByIdWithCompanyVerification(id: string, companyId?: string): Promise<TEntity | null>;
    findOneByIdWithResponseAndCompanyVerification(id: string, companyId?: string): Promise<TResponse | null>;
    
    max(): Promise<TEntity | null>;
    getPagedData(
        fetchRequest: IFetchRequest<TEntity>, 
        getOnlyActive?: boolean, 
        dontGetDeleted?: boolean, 
        companyId?: string
    ): Promise<IDataSourceResponse<TResponse>>;
    getPagedDataWithFilteredRelations(fetchRequest: IFetchRequest<TEntity>, getOnlyActive?: boolean, dontGetDeleted?: boolean, companyId?: string): Promise<IDataSourceResponse<TResponse>>;

    // Transaction Methods
    beginTransaction(): Promise<QueryRunner>;
    rollbackTransaction(queryRunner: QueryRunner): Promise<void>;
    commitTransaction(queryRunner: QueryRunner): Promise<void>;

    // Modification Methods
    partialUpdate(id: string, partialEntity: QueryDeepPartialEntity<TEntity>, contextUser?: ITokenUser, queryRunner?: QueryRunner): Promise<TEntity>;
    invokeDbOperations(entity: TEntity, action: Actions, queryRunner?: QueryRunner): Promise<TEntity>;
    invokeDbOperationsWithResponse(entity: TEntity, action: Actions, queryRunner?: QueryRunner): Promise<TResponse>;
    invokeDbOperationsRange(entities: TEntity[], action: Actions, queryRunner?: QueryRunner): Promise<TEntity[]>;
    invokeDbOperationsRangeWithResponse(entities: TEntity[], action: Actions, queryRunner?: QueryRunner): Promise<TResponse[]>;

    // Query Builder
    queryBuilder(alias: string): SelectQueryBuilder<TEntity>;
}