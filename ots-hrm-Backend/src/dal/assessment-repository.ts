import { injectable } from "tsyringe";
import { Assessment } from "../entities";
import { IAssessmentResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class AssessmentRepository extends GenericRepository<Assessment, IAssessmentResponse> {
    constructor() {
        super(dataSource.getRepository(Assessment));
    }

    // All assessments for one employee (tenant-scoped), scores + skill loaded,
    // oldest first — this is the chart's time axis.
    async findForEmployee(employeeId: string, companyId?: string): Promise<Assessment[]> {
        return this.repository.find({
            where: { employeeId: employeeId as any, companyId: companyId as any, deleted: false } as any,
            relations: { scores: { skill: true } },
            order: { assessedOn: "ASC" },
        });
    }

    async findByEmployeeAndDate(
        employeeId: string,
        assessedOn: Date,
        companyId?: string
    ): Promise<Assessment | null> {
        return this.repository.findOne({
            where: {
                employeeId: employeeId as any,
                assessedOn: assessedOn as any,
                companyId: companyId as any,
                deleted: false,
            } as any,
            relations: { scores: true },
        });
    }

    async findByIdWithScores(id: string, companyId?: string): Promise<Assessment | null> {
        return this.repository.findOne({
            where: { id: id as any, companyId: companyId as any, deleted: false } as any,
            relations: { scores: { skill: true } },
        });
    }
}
