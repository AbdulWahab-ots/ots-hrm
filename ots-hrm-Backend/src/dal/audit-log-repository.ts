import { injectable } from "tsyringe";
import { AuditLog } from "../entities";
import { IAuditLogResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class AuditLogRepository extends GenericRepository<AuditLog, IAuditLogResponse> {
    constructor(){
        super(dataSource.getRepository(AuditLog));
    }


}