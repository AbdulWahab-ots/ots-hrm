import { CompanyEntityBase } from "../base-entities/company-entity-base";
import { EntityBase } from "../base-entities/entity-base";

export interface IToResponseBase<TEntity extends (EntityBase | CompanyEntityBase), TResponse>{
    toResponse: (entity?: TEntity) => TResponse;
}