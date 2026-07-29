import { IRepositoryBase } from "../../dal";
import { ITokenUser, IFetchRequest, IDataSourceResponse, IFilter, Actions, RelationLoad, IGetSingleRecordFilter } from "../../models";
import { IServiceBase } from "../index";
import { CompanyEntityBase } from '../../entities/base-entities/company-entity-base';
import { EntityBase } from "../../entities";
import { IToResponseBase } from "../../entities/abstractions/to-response-base";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
export class Service<TEntity extends (CompanyEntityBase | EntityBase ) & BasicEntityfunctions<TRequest, TResponse, TEntity>, TResponse, TRequest = TEntity> implements IServiceBase<TRequest, TResponse> {
    constructor(protected readonly repository: IRepositoryBase<TEntity, TResponse>, private createEntity: () => TEntity) {
        
    }

    async add(entityRequest: TRequest, contextUser: ITokenUser): Promise<TResponse> {
        return await this.repository.invokeDbOperationsWithResponse(this.createEntity().toEntity(entityRequest, undefined, contextUser), Actions.Add);
    }

    async addMany(entitesRequest: TRequest[], contextUser: ITokenUser): Promise<TResponse[]> {
        return await this.repository.invokeDbOperationsRangeWithResponse(entitesRequest.map(x => this.createEntity().toEntity(x, undefined, contextUser)), Actions.Add)
    }

    async get(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<TRequest> | undefined): Promise<IDataSourceResponse<TResponse>> {
        // Check if active filter is explicitly provided in the request
        const hasActiveFilter = fetchRequest?.queryOptionsRequest?.filtersRequest?.some(filter => 
            String(filter.field) === 'active'
        );
        
        // Apply active filtering only if explicitly requested, otherwise get all records
        const getOnlyActive = hasActiveFilter || false;
        
        return await this.repository.getPagedData(
            fetchRequest ? fetchRequest as any as IFetchRequest<TEntity> : {}, 
            getOnlyActive, 
            true, // Keep deleted filtering (dontGetDeleted = true)
            contextUser?.companyId
        );
    }

    // This method is used to fetch a single record based on filters without applying any relation filters
    async getOne(contextUser: ITokenUser, filtersRequest: IGetSingleRecordFilter<TRequest>): Promise<TResponse | null> {
        return await this.repository.getOneByQueryWithResponse({filters: filtersRequest.filters as Array<any> as Array<IFilter<TEntity, keyof TEntity>>, relations: filtersRequest.relations as RelationLoad<TEntity> | undefined }, false, false, contextUser.companyId);
    }

    async getOneWithFilteredRelations(contextUser: ITokenUser, filtersRequest: IGetSingleRecordFilter<TRequest>): Promise<TResponse | null> {
        // Check if active filter is explicitly provided in the request
        const hasActiveFilter = filtersRequest.filters?.some(filter => 
            String(filter.field) === 'active'
        );
        
        // Apply active filtering only if explicitly requested, otherwise get all records
        const getOnlyActive = hasActiveFilter || false;
        
        return await this.repository.getOneByQueryWithFilteredRelations(
            {
                filters: filtersRequest.filters as Array<any> as Array<IFilter<TEntity, keyof TEntity>>, 
                relations: filtersRequest.relations as RelationLoad<TEntity> | undefined 
            }, 
            getOnlyActive, 
            true, // Keep deleted filtering (dontGetDeleted = true)
            contextUser.companyId
        );
    }

    async getById(id: string, contextUser?: ITokenUser): Promise<TResponse | null> {
        return await this.repository.findOneByIdWithResponseAndCompanyVerification(id, contextUser?.companyId);
    }    
    
    async update(id: string, entityRequest: TRequest, contextUser: ITokenUser): Promise<TResponse> {
        return (await this.repository.partialUpdate(id, entityRequest as QueryDeepPartialEntity<TEntity>, contextUser)).toResponse()
    }

    async updateMany(entitesRequest: (TRequest & { id: string; })[], contextUser: ITokenUser): Promise<TResponse[]> {
        return await this.repository.invokeDbOperationsRangeWithResponse(entitesRequest as any as Array<TEntity>, Actions.Add);
    }

    async delete(id: string, contextUser: ITokenUser): Promise<void> {
        // Verify company ownership before deletion
        const entityExists = await this.repository.verifyCompanyId(id, contextUser.companyId);
        if (!entityExists) {
            throw new Error(`Record with ID ${id} not found or does not belong to your company`);
        }

        let entity = this.createEntity();
        entity.id = id;
        await this.repository.invokeDbOperationsWithResponse(entity, Actions.Delete);
    }    
    
    async deleteMany(ids: Array<string>, contextUser: ITokenUser): Promise<void> {
        // Verify all IDs belong to the company before deletion using batch verification
        const { validIds, invalidIds } = await this.repository.verifyMultipleCompanyIds(ids, contextUser.companyId);
        
        if (invalidIds.length > 0) {
            throw new Error(`The following records were not found or do not belong to your company: ${invalidIds.join(', ')}`);
        }

        await this.repository.invokeDbOperationsRangeWithResponse(validIds.map( x => {
            let entity = this.createEntity();
            entity.id = x;
            return entity;        
        }), Actions.Delete)
    }

    async partialUpdate(id: string, partialEntity: Partial<TRequest>, contextUser: ITokenUser): Promise<TResponse> {
        return (await this.repository.partialUpdate(id, partialEntity as QueryDeepPartialEntity<TEntity>, contextUser)).toResponse();
    }
    
    async getWithFilteredRelations(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<TRequest> | undefined): Promise<IDataSourceResponse<TResponse>> {
        // Check if active filter is explicitly provided in the request
        const hasActiveFilter = fetchRequest?.queryOptionsRequest?.filtersRequest?.some(filter => 
            String(filter.field) === 'active'
        );
        
        // Apply active filtering only if explicitly requested, otherwise get all records
        const getOnlyActive = hasActiveFilter || false;
        
        return await this.repository.getPagedDataWithFilteredRelations(
            fetchRequest ? fetchRequest as any as IFetchRequest<TEntity> : {}, 
            getOnlyActive, 
            true, // Keep deleted filtering (dontGetDeleted = true)
            contextUser?.companyId
        );
    }
} 

type BasicEntityfunctions<TRequest, TResponse, TEntity extends (CompanyEntityBase | EntityBase ) > = IToResponseBase<TEntity, TResponse> & {toEntity: (requestEntity: TRequest, id?: string, contextUser?: ITokenUser) => TEntity };