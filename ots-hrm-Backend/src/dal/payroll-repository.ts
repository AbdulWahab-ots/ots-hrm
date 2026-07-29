import { injectable } from "tsyringe";
import { GenericRepository } from './generics/repository';
import { Payroll } from '../entities';
import { IPayrollRequest, IPayrollResponse } from '../models';
import { dataSource } from './db/db-source';

@injectable()
export class PayrollRepository extends GenericRepository<Payroll, IPayrollResponse> {
    constructor() {
        super(dataSource.getRepository(Payroll));
    }
} 