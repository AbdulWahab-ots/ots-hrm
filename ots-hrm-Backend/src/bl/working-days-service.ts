import { inject, injectable } from "tsyringe";
import { WorkingDaysRepository } from "../dal";
import { WorkingDays } from "../entities";
import { ITokenUser, IWorkingDaysRequest, IWorkingDaysRequestSingle, IWorkingDaysResponse, DayName } from "../models";
import { Service } from "./generics/service";
import { Not, IsNull } from "typeorm";
import { AppError } from "../utility/app-error";

@injectable()
export class WorkingDaysService extends Service<WorkingDays, IWorkingDaysResponse, IWorkingDaysRequestSingle> {
    constructor(@inject('WorkingDaysRepository') private readonly workingDaysRepository: WorkingDaysRepository) {
        super(workingDaysRepository, () => new WorkingDays())
    }

    /**
     * Create or update working days in bulk
     * For create: All 7 days must be provided
     * For update: Can be single or multiple days
     */
    async createOrUpdateWorkingDays(request: IWorkingDaysRequest, contextUser: ITokenUser): Promise<IWorkingDaysResponse[]> {
        const { departmentId, workingDays } = request;

        // Validate that we have working days
        if (!workingDays || workingDays.length === 0) {
            throw new AppError('Working days array is required', '400');
        }

        // Get existing working days for this company/department combination
        const existingWorkingDays = await this.workingDaysRepository.where({
            where: {
                companyId: contextUser.companyId,
                departmentId: departmentId || IsNull()
            }
        });

        // Create a map of existing working days by day name
        const existingDaysMap = new Map(
            existingWorkingDays.map(wd => [wd.dayName, wd])
        );

        const results: IWorkingDaysResponse[] = [];

        // Process each working day in the request
        for (const workingDayRequest of workingDays) {
            const existingDay = existingDaysMap.get(workingDayRequest.dayName);

            if (existingDay) {
                // Update existing working day
                const updateRequest: IWorkingDaysRequestSingle = {
                    dayName: workingDayRequest.dayName,
                    isWorkingDay: workingDayRequest.isWorkingDay,
                    notes: workingDayRequest.notes,
                    departmentId: departmentId
                };

                const updated = await this.update(existingDay.id, updateRequest, contextUser);
                results.push(updated);
            } else {
                // Create new working day
                const createRequest: IWorkingDaysRequestSingle = {
                    dayName: workingDayRequest.dayName,
                    isWorkingDay: workingDayRequest.isWorkingDay ?? true,
                    notes: workingDayRequest.notes,
                    departmentId: departmentId
                };

                const created = await this.add(createRequest, contextUser);
                results.push(created);
            }
        }

        // Sort results by day of week
        return results.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    }

    /**
     * Create working days (all 7 days required)
     */
    async createWorkingDays(request: IWorkingDaysRequest, contextUser: ITokenUser): Promise<IWorkingDaysResponse[]> {
        const { workingDays } = request;

        // Validate all 7 days are provided
        if (!workingDays || workingDays.length !== 7) {
            throw new AppError('All 7 days must be provided for creation', '400');
        }

        // Validate all days are unique
        const dayNames = workingDays.map(wd => wd.dayName);
        const uniqueDays = new Set(dayNames);
        if (uniqueDays.size !== 7) {
            throw new AppError('All 7 days must be unique', '400');
        }

        // Check if working days already exist for this company/department
        const existingCount = await this.workingDaysRepository.entityCount({
            companyId: contextUser.companyId,
            departmentId: request.departmentId || IsNull()
        });

        if (existingCount > 0) {
            const scope = request.departmentId ? 'department' : 'company';
            throw new AppError(`Working days already exist for this ${scope}. Use update instead.`, '409');
        }

        return await this.createOrUpdateWorkingDays(request, contextUser);
    }

    /**
     * Update working days (can be single or multiple days)
     */
    async updateWorkingDays(request: IWorkingDaysRequest, contextUser: ITokenUser): Promise<IWorkingDaysResponse[]> {
        const { workingDays } = request;

        // Validate that we have working days
        if (!workingDays || workingDays.length === 0) {
            throw new AppError('At least one working day must be provided for update', '400');
        }

        return await this.createOrUpdateWorkingDays(request, contextUser);
    }    
    
    /**
     * Add a single working day
     * This method is used for both creating and updating a single working day
     */
    async update(id: string, entityRequest: IWorkingDaysRequestSingle, contextUser: ITokenUser): Promise<IWorkingDaysResponse> {
        const { dayName, departmentId } = entityRequest;

        if (dayName) {
            // Only check for duplicates if we're actually changing the day name
            // Get the existing record first to compare
            const existingRecord = await this.workingDaysRepository.firstOrDefault({
                where: { id }
            });

            // Only check for duplicates if the day name is being changed
            if (existingRecord && existingRecord.dayName !== dayName) {
                const whereConditions = departmentId
                    ? [{ dayName, departmentId, companyId: contextUser.companyId, id: Not(id) }]
                    : [{ dayName, departmentId: IsNull(), companyId: contextUser.companyId, id: Not(id) }];

                const duplicate = await this.workingDaysRepository.firstOrDefault({
                    where: whereConditions
                });

                if (duplicate) {
                    const scope = departmentId ? 'department' : 'company';
                    throw new AppError(`Working day with name ${dayName} already exists for this ${scope}`, '409');
                }
            }

            entityRequest = { ...entityRequest, dayOfWeek: WorkingDays.getDayNumber(dayName) };
        }

        return super.update(id, entityRequest, contextUser);
    }

    /**
     * Get effective working days for a specific department
     * This method will return department-specific working days if they exist,
     * otherwise it will return company-wide default working days
     */
    async getEffectiveWorkingDaysForDepartment(departmentId: string, contextUser: ITokenUser): Promise<IWorkingDaysResponse[]> {
        // First, get department-specific working days
        const departmentWorkingDays = await this.workingDaysRepository.getCompanyRecords(
            contextUser.companyId,
            {
                where: {
                    departmentId: departmentId
                },
                order: { dayOfWeek: 'ASC' }
            }
        );

        // Get company-wide default working days
        const companyDefaultWorkingDays = await this.workingDaysRepository.getCompanyRecords(
            contextUser.companyId,
            {
                where: {
                    departmentId: IsNull()
                },
                order: { dayOfWeek: 'ASC' }
            }
        );

        // Create a map of department-specific days
        const departmentDaysMap = new Map(
            departmentWorkingDays.map(wd => [wd.dayOfWeek, wd])
        );

        // Build the effective working days array
        const effectiveWorkingDays: WorkingDays[] = [];
        
        // For each day of the week (1-7), use department-specific if available, otherwise use company default
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
            const departmentDay = departmentDaysMap.get(dayOfWeek);
            if (departmentDay) {
                effectiveWorkingDays.push(departmentDay);
            } else {
                const companyDay = companyDefaultWorkingDays.find(wd => wd.dayOfWeek === dayOfWeek);
                if (companyDay) {
                    effectiveWorkingDays.push(companyDay);
                }
            }
        }

        return effectiveWorkingDays.map(wd => wd.toResponse());
    }

    /**
     * Get company-wide default working days
     */
    async getCompanyDefaultWorkingDays(contextUser: ITokenUser): Promise<IWorkingDaysResponse[]> {
        const workingDays = await this.workingDaysRepository.getCompanyRecords(
            contextUser.companyId,
            {
                where: {
                    departmentId: IsNull()
                },
                order: { dayOfWeek: 'ASC' }
            }
        );

        return workingDays.map(wd => wd.toResponse());
    }

    /**
     * Get department-specific working days (only those explicitly set for the department)
     */
    async getDepartmentSpecificWorkingDays(departmentId: string, contextUser: ITokenUser): Promise<IWorkingDaysResponse[]> {
        const workingDays = await this.workingDaysRepository.getCompanyRecords(
            contextUser.companyId,
            {
                where: {
                    departmentId: departmentId
                },
                order: { dayOfWeek: 'ASC' }
            }
        );

        return workingDays.map(wd => wd.toResponse());
    }    

}
