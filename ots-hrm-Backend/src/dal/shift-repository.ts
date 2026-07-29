import { injectable } from "tsyringe";
import { IShiftResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Shift  } from '../entities';

@injectable()
export class ShiftRepository extends GenericRepository<Shift, IShiftResponse> {
    constructor(){
        super(dataSource.getRepository(Shift));
    }

    // Custom method to find shifts by name and department/company
    async findByNameAndScope(name: string, companyId: string, departmentId?: string): Promise<Shift | null> {
        const queryBuilder = this.repository.createQueryBuilder('shift')
            .where('shift.name = :name', { name })
            .andWhere('shift.companyId = :companyId', { companyId })
            .andWhere('shift.deleted = false');

        if (departmentId) {
            queryBuilder.andWhere('shift.departmentId = :departmentId', { departmentId });
        } else {
            queryBuilder.andWhere('shift.departmentId IS NULL');
        }

        return await queryBuilder.getOne();
    }
}