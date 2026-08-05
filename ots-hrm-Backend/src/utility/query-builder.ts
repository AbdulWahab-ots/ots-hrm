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

// Builds a (possibly nested) where-clause entry from a field path. Most fields are a
// plain column name ("status"), but a dot-separated path ("requestedByUser.firstName")
// targets a column on a joined relation - TypeORM expects that as a nested object
// ({ requestedByUser: { firstName: ... } }), not a flat dotted key, so this recurses
// to build the right shape. The relation must already be present in `includes` for
// TypeORM to generate the join this filter relies on.
const buildNestedWhere = (fieldPath: string, condition: any): any => {
    const dot = fieldPath.indexOf('.');
    if (dot === -1) return { [fieldPath]: condition };
    const head = fieldPath.slice(0, dot);
    const rest = fieldPath.slice(dot + 1);
    return { [head]: buildNestedWhere(rest, condition) };
};

const queryMapper = <T>(filterRequest: IFilter<T, keyof T>): FindOptionsWhere<T> => {
    let whereClause: FindOptionsWhere<T> = {};
    const field = filterRequest.field as string;

    switch (filterRequest.matchMode) {
        case FilterMatchModes.Contains:
            whereClause = buildNestedWhere(field, ArrayContains([filterRequest.value]));
            break;
        case FilterMatchModes.Equal:
            whereClause = buildNestedWhere(field, Equal(filterRequest.value));
            break;
        case FilterMatchModes.GreaterThan:
            whereClause = buildNestedWhere(field, MoreThan(filterRequest.value));
            break;
        case FilterMatchModes.GreaterThanOrEqual:
            whereClause = buildNestedWhere(field, MoreThanOrEqual(filterRequest.value));
            break;
        case FilterMatchModes.LessThan:
            whereClause = buildNestedWhere(field, LessThan(filterRequest.value));
            break;
        case FilterMatchModes.LessThanOrEqual:
            whereClause = buildNestedWhere(field, LessThanOrEqual(filterRequest.value));
            break;
        case FilterMatchModes.NotEqual:
            whereClause = buildNestedWhere(field, Not(filterRequest.value));
            break;
        case FilterMatchModes.Like:
            whereClause = buildNestedWhere(field, filterRequest.ignoreCase ? ILike(`%${filterRequest.value}%`) : Like(`%${filterRequest.value}%`));
            break;
        case FilterMatchModes.Any:
            whereClause = buildNestedWhere(field, Any<T[keyof T]>(filterRequest.values as Array<any>));
            break;
        case FilterMatchModes.Between:
            whereClause = buildNestedWhere(field, Between(filterRequest.rangeValues?.start, filterRequest.rangeValues?.end));
            break;
        case FilterMatchModes.In:
            whereClause = buildNestedWhere(field, In(filterRequest.values as Array<T[keyof T]>));
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