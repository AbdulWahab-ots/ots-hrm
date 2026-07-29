import { injectable } from "tsyringe";
import { Department } from "../entities";
import { IDepartmentResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class DepartmentRepository extends GenericRepository<Department, IDepartmentResponse>   {

    constructor () {
        super(dataSource.getRepository(Department));
    }
    
}