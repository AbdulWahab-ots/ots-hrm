import { Any, ArrayContains, Between, Equal, FindManyOptions, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, ILike, In, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not } from "typeorm";
import { CompanyEntityBase, EntityBase } from "../entities";
import { IFetchRequest, IFilter } from "../models";
import { FilterMatchModes, FilterOperators, SortOrder } from "../models";

export const buildQuery = <T extends CompanyEntityBase | EntityBase>(fetchRequest: IFetchRequest<T>, getOnlyActive: boolean = false, dontGetDeleted: boolean = true, companyId?: string, filterRelations: boolean = false): FindManyOptions<T> => {
    let query: FindManyOptions<T> = {}
    let sortOptions: FindOptionsOrder<T> = {};
    const pagedRequest = fetchRequest.pagedListRequest;

    if (fetchRequest.queryOptionsRequest?.sortRequest) {
        for (const sortRequest of fetchRequest.queryOptionsRequest?.sortRequest.sort((a, b) => a.priority - b.priority)) {
            sortOptions = { ...sortOptions, [sortRequest.field]: sortRequest.direction === SortOrder.Ascending ? "asc" : "desc" }
        }
    }
    
    query.where = queryOptionsMapper(fetchRequest.queryOptionsRequest?.filtersRequest ?? [], getOnlyActive, dontGetDeleted, companyId, fetchRequest.queryOptionsRequest?.includes, filterRelations);
    query.order = sortOptions;
    query.relations = fetchRequest.queryOptionsRequest?.includes as (FindOptionsRelations<T> | undefined);
    if (pagedRequest && !pagedRequest.getAllRecords) {
        query.skip = (pagedRequest.pageNo - 1) * pagedRequest.pageSize;
        query.take = pagedRequest.pageSize;
    }

    return query;
}

const queryMapper = <T>(filterRequest: IFilter<T, keyof T>): FindOptionsWhere<T> => {
    let whereClause: FindOptionsWhere<T> = {};

    switch (filterRequest.matchMode) {
        case FilterMatchModes.Contains:
            whereClause = { [filterRequest.field as string]: ArrayContains([filterRequest.value]) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.Equal:
            whereClause = { [filterRequest.field as string]: Equal(filterRequest.value) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.GreaterThan:
            whereClause = { [filterRequest.field as string]: MoreThan(filterRequest.value) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.GreaterThanOrEqual:
            whereClause = { [filterRequest.field as string]: MoreThanOrEqual(filterRequest.value) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.LessThan:
            whereClause = { [filterRequest.field as string]: LessThan(filterRequest.value) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.LessThanOrEqual:
            whereClause = { [filterRequest.field as string]: LessThanOrEqual(filterRequest.value) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.NotEqual:
            whereClause = { [filterRequest.field as string]: Not(filterRequest.value) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.Like:
            whereClause = { [filterRequest.field as string]: (filterRequest.ignoreCase ? ILike(`%${filterRequest.value}%`) : Like(`%${filterRequest.value}%`)) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.Any:
            whereClause = { [filterRequest.field as string]: Any<T[keyof T]>(filterRequest.values as Array<any>) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.Between:
            whereClause = { [filterRequest.field as string]: Between(filterRequest.rangeValues?.start, filterRequest.rangeValues?.end) } as FindOptionsWhere<T>;
            break;
        case FilterMatchModes.In:
            whereClause = { [filterRequest.field as string]: In(filterRequest.values as Array<T[keyof T]>) } as FindOptionsWhere<T>;
            break;
        default:
            break;
    }

    return whereClause;
}

export const queryOptionsMapper = <T extends CompanyEntityBase | EntityBase>(
    filters: Array<IFilter<T, keyof T>>, 
    getOnlyActive: boolean = false, 
    dontGetDeleted: boolean = true, 
    companyId?: string,
    includes?: any,
    filterRelations: boolean = false
): Array<FindOptionsWhere<T>> => {
    let defaultWhereClause: FindOptionsWhere<T> = {};

    if (companyId) {
        const whereClause: FindOptionsWhere<CompanyEntityBase> = { companyId };
        defaultWhereClause = { ...defaultWhereClause, ...(whereClause as FindOptionsWhere<T>) };
    }

    if (getOnlyActive) defaultWhereClause = { ...defaultWhereClause, ...({ active: true } as FindOptionsWhere<T>) };

    if (dontGetDeleted) defaultWhereClause = { ...defaultWhereClause, ...({ deleted: false } as FindOptionsWhere<T>) };

    // Add relation filtering if requested
    if (filterRelations && includes) {
        // Handle includes as either array or object
        const includesArray = Array.isArray(includes) 
            ? includes as string[]
            : Object.keys(includes).filter(key => includes[key] === true);

        // Apply relation filters
        includesArray.forEach((relationName: string) => {
            const relationFilter: any = {};
            if (getOnlyActive) relationFilter.active = true;
            if (dontGetDeleted) relationFilter.deleted = false;
            if (companyId) relationFilter.companyId = companyId;
            
            if (Object.keys(relationFilter).length > 0) {
                (defaultWhereClause as any)[relationName] = relationFilter;
            }
        });
    }

    // Accumulate caller filters: one conjunctive bucket (And / unspecified) plus a branch per Or filter.
    const andBucket: FindOptionsWhere<T> = {};
    const orBranches: Array<FindOptionsWhere<T>> = [];
    for (const filter of filters) {
        if (filter.operator === FilterOperators.Or) {
            orBranches.push(queryMapper(filter));
        } else {
            Object.assign(andBucket, queryMapper(filter));
        }
    }

    // Spread defaultWhereClause LAST in every branch so the tenant scope (companyId/active/deleted and the
    // relation guards) always wins and a caller filter on those keys (e.g. field:"companyId") can't overwrite it.
    // With Or filters present the required And filters are distributed into each alternative, so there is no
    // bare scope-only branch to subsume them: scope AND (andFilters) AND (or1 OR or2 ...).
    return orBranches.length
        ? orBranches.map(orBranch => ({ ...andBucket, ...orBranch, ...defaultWhereClause }))
        : [{ ...andBucket, ...defaultWhereClause }];
}