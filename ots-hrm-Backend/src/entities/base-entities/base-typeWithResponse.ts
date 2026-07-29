import { IToResponseBase } from "../abstractions/to-response-base";
import { CompanyEntityBase } from "./company-entity-base";
import { EntityBase } from "./entity-base";

export type BaseType<TEntity extends (EntityBase | CompanyEntityBase), TResponse> = TEntity & IToResponseBase<TEntity, TResponse>;