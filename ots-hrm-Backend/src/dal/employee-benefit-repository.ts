import { injectable } from "tsyringe";
import { GenericRepository } from "./generics/repository";
import { EmployeeBenefit } from "../entities/employee-benefit";
import { IEmployeeBenefitResponse } from "../models";
import { dataSource } from "./db/db-source";

@injectable()
export class EmployeeBenefitRepository extends GenericRepository<EmployeeBenefit, IEmployeeBenefitResponse> {
    constructor() {
        super(dataSource.getRepository(EmployeeBenefit));
    }
} 