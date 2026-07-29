import { inject, injectable } from "tsyringe";
import { AttendanceSummaryRepository } from "../dal";
import { AttendanceSummary } from "../entities";
import { IAttendanceSummaryRequest, IAttendanceSummaryResponse } from "../models";
import { Service } from "./generics/service";

@injectable()
export class AttendanceSummaryService extends Service<AttendanceSummary, IAttendanceSummaryResponse, IAttendanceSummaryRequest> {
    constructor(
        @inject('AttendanceSummaryRepository') private readonly attendanceSummaryRepository: AttendanceSummaryRepository
    ) {
        super(attendanceSummaryRepository, () => new AttendanceSummary());
    }
}
