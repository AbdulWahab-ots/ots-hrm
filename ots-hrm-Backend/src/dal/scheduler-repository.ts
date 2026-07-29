import { injectable } from "tsyringe";
import { ISchedulerResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Scheduler } from '../entities';

@injectable()
export class SchedulerRepository extends GenericRepository<Scheduler, ISchedulerResponse> {
    constructor(){
        super(dataSource.getRepository(Scheduler));
    }
}