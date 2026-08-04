import { inject, injectable } from "tsyringe";
import { DepartmentRepository, DesignationRepository, ShiftRepository, BenefitRepository, PublicHolidayRepository, EmployeeRepository } from "../dal";
import { Department } from "../entities";
import { IDepartmentRequest, IDepartmentResponse, ITokenUser } from "../models";
import { Service } from "./generics/service";
import { generateCodeFromName, sanitizeString } from "../utility";
import { AppError } from "../utility/app-error";
import { Not } from "typeorm";
import { WorkingDaysService } from "./working-days-service";

export interface IDepartmentDependencyCounts {
    employees: number;
    designations: number;
    shifts: number;
    benefits: number;
    holidays: number;
}

@injectable()
export class DepartmentService extends Service<Department, IDepartmentResponse, IDepartmentRequest> {
    constructor(
        @inject('DepartmentRepository') private readonly departmentRepository: DepartmentRepository,
        @inject('DesignationRepository') private readonly designationRepository: DesignationRepository,
        @inject('WorkingDaysService') private readonly workingDaysService: WorkingDaysService,
        @inject('ShiftRepository') private readonly shiftRepository: ShiftRepository,
        @inject('BenefitRepository') private readonly benefitRepository: BenefitRepository,
        @inject('PublicHolidayRepository') private readonly publicHolidayRepository: PublicHolidayRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
    ) {
        super(departmentRepository, () => new Department());
    }

    async add(request: IDepartmentRequest, contextUser: ITokenUser): Promise<IDepartmentResponse> {
        let { workingDays, ...departmentData } = request;

        // Create the department first (without working days)
        const department = await super.add(departmentData, contextUser);

        // If working days are provided, create them for this department
        if (workingDays && workingDays.length > 0) {
            try {
                await this.workingDaysService.createOrUpdateWorkingDays({
                    departmentId: department.id,
                    workingDays: workingDays
                }, contextUser);
            } catch (error) {
                // Log the working days creation error but don't fail the department creation
                console.error(`Failed to create working days for department ${department.id}:`, error);
            }
        }

        return department;
    }

    async update(id: string, request: IDepartmentRequest, contextUser: ITokenUser): Promise<IDepartmentResponse> {
        let { name, workingDays, ...departmentData } = request;
        name = sanitizeString(name);
        const camelCasedName = generateCodeFromName(name);

        const existing = await this.departmentRepository.firstOrDefault({
            where: [
                { name: name, id: Not(id), companyId: contextUser.companyId, deleted: false },
                { code: camelCasedName, id: Not(id), companyId: contextUser.companyId, deleted: false }
            ]
        });

        if (existing) {
            throw new AppError(`Department with name ${name} already exists`, '409');
        }

        // Prepare department update data without working days
        const departmentUpdateRequest = {
            ...departmentData,
            name,
            code: camelCasedName
        };

        // Update the department first (without working days)
        const department = await super.update(id, departmentUpdateRequest, contextUser);

        // If working days are provided, update them for this department
        if (workingDays && workingDays.length > 0) {
            try {
                await this.workingDaysService.createOrUpdateWorkingDays({
                    departmentId: id,
                    workingDays: workingDays
                }, contextUser);
            } catch (error) {
                // Log the working days update error but don't fail the department update
                console.error(`Failed to update working days for department ${id}:`, error);
            }
        }

        return department;
    }

    // Private method to validate department belongs to same tenant
    public async validateDepartmentTenant(departmentId: string, contextUser: ITokenUser): Promise<void> {
        const department = await this.departmentRepository.firstOrDefault({
            where: { id: departmentId }
        });

        if (!department) {
            throw new AppError('Department not found', '404');
        }

        // Check if department belongs to same company/tenant
        if (department.companyId !== contextUser.companyId) {
            throw new AppError('You cannot assign designation to a department from different organization', '403');
        }
    }

    /**
     * Counts records across the app that reference this department, so we can
     * (a) block deletion when removing it would orphan/break those records, and
     * (b) let the UI warn the admin what is attached before they even try to delete.
     */
    public async getDependencyCounts(id: string, contextUser: ITokenUser): Promise<IDepartmentDependencyCounts> {
        const [employees, designations, shifts, benefits, holidays] = await Promise.all([
            this.employeeRepository.entityCount({ departmentId: id, companyId: contextUser.companyId, deleted: false } as any),
            this.designationRepository.entityCount({ departmentId: id, companyId: contextUser.companyId, deleted: false } as any),
            this.shiftRepository.entityCount({ departmentId: id, companyId: contextUser.companyId, deleted: false } as any),
            this.benefitRepository.entityCount({ departmentId: id, companyId: contextUser.companyId, deleted: false } as any),
            this.publicHolidayRepository.entityCount({ departmentId: id, companyId: contextUser.companyId, deleted: false } as any),
        ]);

        return { employees, designations, shifts, benefits, holidays };
    }

    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        const counts = await this.getDependencyCounts(id, contextUser);
        const blockers: string[] = [];

        if (counts.employees > 0) blockers.push(`${counts.employees} employee(s)`);
        if (counts.designations > 0) blockers.push(`${counts.designations} designation(s)`);
        if (counts.shifts > 0) blockers.push(`${counts.shifts} shift(s)`);
        if (counts.benefits > 0) blockers.push(`${counts.benefits} benefit(s)`);
        if (counts.holidays > 0) blockers.push(`${counts.holidays} holiday(s)`);

        if (blockers.length > 0) {
            throw new AppError(
                `Cannot delete this department because it is still linked to ${blockers.join(', ')}. Please reassign or remove these first.`,
                '409'
            );
        }

        // Nothing references this department anymore - soft delete so it disappears
        // from active lists/dropdowns while keeping the row for history/audit.
        await this.departmentRepository.partialUpdate(id, { deleted: true, active: false } as any, contextUser, undefined, ['active', 'deleted']);
    }

}
