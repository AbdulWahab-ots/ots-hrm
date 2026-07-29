import { injectable } from "tsyringe";
import { ActivityLog } from "../entities";
import { IActivityLogResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class ActivityLogRepository extends GenericRepository<ActivityLog, IActivityLogResponse> {
    constructor(){
        super(dataSource.getRepository(ActivityLog));
    }


}