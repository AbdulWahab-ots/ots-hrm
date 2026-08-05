import { inject, injectable } from "tsyringe";
import { LeaveTypeRepository, EmployeeRepository } from "../dal";
import { LeaveType } from "../entities";
import { ILeaveTypeRequest, ILeaveTypeResponse, ITokenUser, IFetchRequest, IDataSourceResponse } from "../models";
import { Service } from "./generics/service";
import { generateCodeFromName, sanitizeString, requiresOneYearTenure } from "../utility";
import { AppError } from "../utility/app-error";
import { Not } from "typeorm";

@injectable()
export class LeaveTypeService extends Service<LeaveType, ILeaveTypeResponse, ILeaveTypeRequest> {
    constructor(
        @inject('LeaveTypeRepository') private readonly leaveTypeRepository: LeaveTypeRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository
    ) {
        super(leaveTypeRepository, () => new LeaveType())
    }

    // Employees only see leave types they're currently eligible to request - e.g.
    // Annual Leave requires 1 full completed year of tenure. Admin/management callers
    // (managing the LeaveType configuration itself, not requesting leave) see every
    // configured type unfiltered, since role !== 'employee' for those callers.
    public async get(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<ILeaveTypeRequest>): Promise<IDataSourceResponse<ILeaveTypeResponse>> {
        const response = await super.get(contextUser, fetchRequest);

        if (contextUser?.role === 'employee' && contextUser.id) {
            const employee = await this.employeeRepository.firstOrDefault({
                where: { userId: contextUser.id, companyId: contextUser.companyId }
            });

            if (employee && !employee.hasCompletedOneYear()) {
                const eligible = (response.data || []).filter((lt: any) => !requiresOneYearTenure(lt.name));
                const removed = response.data.length - eligible.length;
                response.data = eligible;
                response.total = Math.max(0, response.total - removed);
            }
        }

        return response;
    }

    async update(id: string, request: ILeaveTypeRequest, contextUser: ITokenUser): Promise<ILeaveTypeResponse> {
        let { name } = request;
        name = sanitizeString(name);
        const camelCasedName = generateCodeFromName(name);

        const existing = await this.leaveTypeRepository.firstOrDefault({
            where: [
                { name: name, id: Not(id), companyId: contextUser.companyId, deleted: false },
                { code: camelCasedName, id: Not(id), companyId: contextUser.companyId, deleted: false }
            ]
        });

        if (existing) {
            throw new AppError(`LeaveType with name ${name} already exists`, '409');
        }

        request.code = camelCasedName;

        return super.update(id, request, contextUser);
    }

    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        // No other entity references LeaveType yet, so there is nothing to block on today.
        // Still soft-delete (instead of hard-removing) so it disappears from active lists
        // while staying intact for whichever leave-request/leave-balance feature lands next.
        await this.leaveTypeRepository.partialUpdate(id, { deleted: true, active: false } as any, contextUser, undefined, ['active', 'deleted']);
    }

}
