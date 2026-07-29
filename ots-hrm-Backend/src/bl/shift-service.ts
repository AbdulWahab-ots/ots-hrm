import { inject, injectable } from "tsyringe";
import { ShiftRepository, EmployeeRepository } from "../dal";
import { Shift } from "../entities";
import { Department } from "../entities/department";
import { IShiftRequest, IShiftResponse, ITokenUser, Actions } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";

@injectable()
export class ShiftService extends Service<Shift, IShiftResponse, IShiftRequest> {
    constructor(
        @inject('ShiftRepository') private readonly shiftRepository: ShiftRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
    ) {
        super(shiftRepository, () => new Shift())
    }

    public async add(entityRequest: IShiftRequest, contextUser: ITokenUser): Promise<IShiftResponse> {
        // Validate that shift name is unique for the company/department combination
        await this.validateUniqueShift(entityRequest, contextUser);
        
        return await super.add(entityRequest, contextUser);
    }

    public async update(id: string, entityRequest: IShiftRequest, contextUser: ITokenUser): Promise<IShiftResponse> {
        // Validate that shift name is unique for the company/department combination (excluding current record)
        await this.validateUniqueShift(entityRequest, contextUser, id);
        
        // Get the existing entity first, scoped to the caller's company so a shift from
        // another company can't be updated by id. A super admin acting on a company carries
        // that company as contextUser.companyId (set in validateCompanyHeader).
        const existingShift = await this.shiftRepository.firstOrDefault({ where: { id, companyId: contextUser.companyId } });
        if (!existingShift) {
            throw new AppError('Shift not found', '404');
        }

        // Update the entity properties
        existingShift.name = entityRequest.name;
        if (entityRequest.shiftType) existingShift.shiftType = entityRequest.shiftType;
        if (entityRequest.startTime) existingShift.startTime = entityRequest.startTime;
        if (entityRequest.endTime) existingShift.endTime = entityRequest.endTime;
        if (entityRequest.marginTime !== undefined) existingShift.marginTime = entityRequest.marginTime;
        if (entityRequest.breakDuration !== undefined) existingShift.breakDuration = entityRequest.breakDuration;
        if (entityRequest.order !== undefined) existingShift.order = entityRequest.order;
        if (entityRequest.departmentId !== undefined) existingShift.departmentId = entityRequest.departmentId || undefined;

        // Set department if departmentId is provided
        if (entityRequest.departmentId) {
            const department = new Department();
            department.id = entityRequest.departmentId;
            existingShift.department = department;
        } else {
            existingShift.department = undefined;
        }

        // Set Modifed
        if(contextUser) {
            existingShift.modifiedById = contextUser.id;
            existingShift.modifiedBy = contextUser.name;
            existingShift.modifiedAt = new Date();
        }

        // Save the entity using the repository's saveEntity method (this will trigger entity hooks)
        const savedEntity = await this.shiftRepository.invokeDbOperations(existingShift, Actions.Update);
        return savedEntity.toResponse();
    }

    private async validateUniqueShift(entityRequest: IShiftRequest, contextUser: ITokenUser, excludeId?: string): Promise<void> {
        // Check if a shift with the same name exists for the same company/department combination
        const existingShift = await this.shiftRepository.findByNameAndScope(
            entityRequest.name,
            contextUser.companyId,
            entityRequest.departmentId
        );

        if (existingShift && (!excludeId || existingShift.id !== excludeId)) {
            const scope = entityRequest.departmentId ? 'department' : 'company';
            throw new AppError(`A shift with the name '${entityRequest.name}' already exists for this ${scope}.`, '409');
        }
    }

    /** Counts employees currently assigned to this shift. */
    public async getDependencyCounts(id: string, contextUser: ITokenUser): Promise<{ employees: number }> {
        const employees = await this.employeeRepository.entityCount({ shiftId: id, companyId: contextUser.companyId, deleted: false } as any);
        return { employees };
    }

    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const { employees } = await this.getDependencyCounts(id, contextUser);

        if (employees > 0) {
            throw new AppError(
                `Cannot delete this shift because ${employees} employee(s) are still assigned to it. Please reassign them first.`,
                '409'
            );
        }

        await this.shiftRepository.partialUpdate(id, { deleted: true, active: false } as any, contextUser);
    }
}
