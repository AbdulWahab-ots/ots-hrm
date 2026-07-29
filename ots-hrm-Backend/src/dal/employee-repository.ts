import { injectable } from "tsyringe";
import { IEmployeeResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Employee } from '../entities';

@injectable()
export class EmployeeRepository extends GenericRepository<Employee, IEmployeeResponse> {
    constructor(){
        super(dataSource.getRepository(Employee));
    }
}