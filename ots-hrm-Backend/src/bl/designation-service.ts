import { inject, injectable } from "tsyringe";
import { DesignationRepository, EmployeeRepository } from "../dal";
import { Designation } from "../entities";
import { IDesignationRequest, IDesignationResponse, ITokenUser } from "../models";
import { Service } from "./generics/service";
import { generateCodeFromName, sanitizeString } from "../utility";
import { AppError } from "../utility/app-error";
import { Not } from "typeorm";
import { DepartmentService } from './department-service';

@injectable()
export class DesignationService extends Service<Designation, IDesignationResponse, IDesignationRequest> {
    constructor(
        @inject('DesignationRepository') private readonly designationRepository: DesignationRepository,
        @inject('DepartmentService') private readonly departmentService: DepartmentService,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
    ) {
        super(designationRepository, () => new Designation())
    }

    async add(request: IDesignationRequest, contextUser: ITokenUser): Promise<IDesignationResponse> {

        if (request.departmentId) {
            await this.departmentService.validateDepartmentTenant(request?.departmentId, contextUser);
        }

        return super.add(request, contextUser);
    }

    async update(id: string, request: IDesignationRequest, contextUser: ITokenUser): Promise<IDesignationResponse> {
        let { title } = request;

        if (title) {
            title = sanitizeString(title);
            const camelCasedName = generateCodeFromName(title);

            const existing = await this.designationRepository.firstOrDefault({
                where: [
                    { title: title, id: Not(id), companyId: contextUser.companyId, deleted: false },
                    { code: camelCasedName, id: Not(id), companyId: contextUser.companyId, deleted: false }
                ]
            });

            if (existing) {
                throw new AppError(`Designation with title ${title} already exists`, '409');
            }

            request.code = camelCasedName;
        }

        return super.update(id, request, contextUser);
    }

    /** Counts employees currently assigned to this designation. */
    public async getDependencyCounts(id: string, contextUser: ITokenUser): Promise<{ employees: number }> {
        const employees = await this.employeeRepository.entityCount({ designationId: id, companyId: contextUser.companyId, deleted: false } as any);
        return { employees };
    }

    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const { employees } = await this.getDependencyCounts(id, contextUser);

        if (employees > 0) {
            throw new AppError(
                `Cannot delete this designation because ${employees} employee(s) are still assigned to it. Please reassign them first.`,
                '409'
            );
        }

        await this.designationRepository.partialUpdate(id, { deleted: true, active: false } as any, contextUser, undefined, ['active', 'deleted']);
    }

}
