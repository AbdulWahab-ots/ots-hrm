import { injectable } from "tsyringe";
import { GenericRepository } from './generics/repository';
import { AttendanceSummary } from '../entities';
import { IAttendanceSummaryRequest, IAttendanceSummaryResponse } from '../models';
import { dataSource } from './db/db-source';

@injectable()
export class AttendanceSummaryRepository extends GenericRepository<AttendanceSummary, IAttendanceSummaryResponse> {
    constructor() {
        super(dataSource.getRepository(AttendanceSummary));
    }
}
