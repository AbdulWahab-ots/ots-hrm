import { injectable } from "tsyringe";
import { LeaveType } from "../entities";
import { ILeaveTypeResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class LeaveTypeRepository extends GenericRepository<LeaveType, ILeaveTypeResponse>   {

    constructor () {
        super(dataSource.getRepository(LeaveType));
    }
    
}