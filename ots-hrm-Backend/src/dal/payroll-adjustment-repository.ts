import { injectable } from "tsyringe";
import { GenericRepository } from './generics/repository';
import { PayrollAdjustment } from '../entities';
import { IPayrollAdjustmentRequest, IPayrollAdjustmentResponse } from '../models';
import { dataSource } from './db/db-source';

@injectable()
export class PayrollAdjustmentRepository extends GenericRepository<PayrollAdjustment, IPayrollAdjustmentResponse> {
    constructor() {
        super(dataSource.getRepository(PayrollAdjustment));
    }
} 