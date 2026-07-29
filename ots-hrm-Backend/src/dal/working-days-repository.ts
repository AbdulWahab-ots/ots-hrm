import { injectable } from "tsyringe";
import { IWorkingDaysResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { WorkingDays } from '../entities';

@injectable()
export class WorkingDaysRepository extends GenericRepository<WorkingDays, IWorkingDaysResponse> {
    constructor(){
        super(dataSource.getRepository(WorkingDays));
    }
}