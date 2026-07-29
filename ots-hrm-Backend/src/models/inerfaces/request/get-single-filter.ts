import { RelationLoad } from "../relation-loading-types";
import { IFilter } from "./fetchRequest";

export interface IGetSingleRecordFilter<T> {
    filters: Array<IFilter<T, keyof T>>, 
    relations?: RelationLoad<T | T>
}