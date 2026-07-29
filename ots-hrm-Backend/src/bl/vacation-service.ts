import { inject, injectable } from "tsyringe";
import { VacationRepository, AttendanceRepository, EmployeeRepository, PublicHolidayRepository } from "../dal";
import { LeaveTypeService } from "../bl";
import { NotificationService } from "./notification-service";
import { NotificationType } from "../models";
import { WorkingDaysService } from "./working-days-service";
import { Vacation, Attendance } from "../entities";
import { IFetchRequest,  FilterMatchModes, FilterOperators, IVacationStatusRequest, ITokenUser, IVacationRequest, IVacationResponse, VacationStatus, IDataSourceResponse, RequestType, AttendanceStatus, Actions } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";
import { Between, LessThanOrEqual, MoreThanOrEqual, Equal, Or, Not, In } from "typeorm";
import { DefaultRoles } from "../constants";

@injectable()
export class VacationService extends Service<Vacation, IVacationResponse, IVacationRequest> {
    constructor(
        @inject('LeaveTypeService') private readonly leaveTypeService: LeaveTypeService,
        @inject('VacationRepository') private readonly vacationRepository: VacationRepository,
        @inject('AttendanceRepository') private readonly attendanceRepository: AttendanceRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('WorkingDaysService') private readonly workingDaysService: WorkingDaysService,
        @inject('PublicHolidayRepository') private readonly publicHolidayRepository: PublicHolidayRepository,
        @inject('NotificationService') private readonly notificationService: NotificationService
    ) {
        super(vacationRepository, () => new Vacation())
    }

    // add vacation or remote work request
    async add(vacationRequest: IVacationRequest, contextUser: ITokenUser): Promise<IVacationResponse> {

        // Set default request type if not provided
        if (!vacationRequest.requestType) {
            vacationRequest.requestType = RequestType.LEAVE;
        }

        // Validate type ID (only for leave requests) — fetch once and reuse below
        let leaveType: Awaited<ReturnType<typeof this.leaveTypeService.getById>> | null = null;
        if (vacationRequest.requestType === RequestType.LEAVE) {
            if (!vacationRequest.typeId) {
                throw new AppError('typeId is required for leave requests', '400');
            }

            leaveType = await this.leaveTypeService.getById(vacationRequest.typeId, contextUser);
            if (!leaveType) {
                throw new AppError(`Leave type with ID ${vacationRequest.typeId} does not exist`, '404');
            }
        }

        // To date should be greater than or equal to from date
        if (new Date(vacationRequest.toDate) < new Date(vacationRequest.fromDate)) {
            throw new AppError('To date must be greater than or equal to from date', '400');
        }

        // fromDate must not be in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(vacationRequest.fromDate) < today) {
            throw new AppError('Leave start date cannot be in the past', '400');
        }

        // Check for overlapping requests of ANY type (leave or remote work)
        const fromDate = vacationRequest.fromDate;
        const toDate = vacationRequest.toDate;
        // Check for any overlapping requests regardless of type (leave or remote work)
        const existingVacation = await this.checkForOverlappingRequests(
            contextUser.id,
            fromDate,
            toDate
        );

        if (existingVacation) {
            const existingType = existingVacation.requestType === RequestType.LEAVE ? 'leave' : 'remote work';
            const newType = vacationRequest.requestType === RequestType.LEAVE ? 'leave' : 'remote work';
            
            throw new AppError(
                `Cannot apply for ${newType} request. You already have an overlapping ${existingType} request for the same period (${existingVacation.fromDate} to ${existingVacation.toDate})`,
                '409'
            );
        }

        // Resolve which calendar days actually count: the employee's configured working
        // days minus public holidays (falls back to Mon-Fri when not configured).
        const requesterDepartmentId = await this.getDepartmentIdForUser(contextUser.id);
        const workingDates = await this.getWorkingDatesInRange(vacationRequest.fromDate, vacationRequest.toDate, requesterDepartmentId, contextUser);

        // Only check leave balance for leave requests
        if (vacationRequest.requestType === RequestType.LEAVE && vacationRequest.typeId) {
            // maxDaysPerYear is an annual allowance, so only count leaves taken in the
            // same calendar year as the requested leave (otherwise it behaves as a
            // lifetime cap that never resets).
            const leaveYear = new Date(vacationRequest.fromDate).getFullYear();
            const yearStart = new Date(leaveYear, 0, 1, 0, 0, 0, 0);
            const yearEnd = new Date(leaveYear, 11, 31, 23, 59, 59, 999);

            // get user previous leave type balance for the relevant year
            const leaveTypeBalance = await this.vacationRepository.getCompanyRecords(contextUser.companyId, {
                where: {
                    requestedBy: contextUser.id,
                    typeId: vacationRequest.typeId,
                    requestType: RequestType.LEAVE,
                    fromDate: Between(yearStart, yearEnd),
                    // not equal to cancelled or rejected
                    status: Not(In([VacationStatus.CANCELLED, VacationStatus.REJECTED])),
                }
            });

            // Calculate total days for the leaveTypeBalance
            const alreadyTakenLeaves = leaveTypeBalance.reduce((acc, vacation) => {
                return acc + vacation.totalDays;
            }, 0);

            const requestedDays = workingDates.length;

            // leaveType is guaranteed non-null here (checked at top of LEAVE block)
            const lt = leaveType!;

            // Check maxConsecutiveDays limit (0 means no limit)
            if (lt.maxConsecutiveDays > 0 && requestedDays > lt.maxConsecutiveDays) {
                throw new AppError(
                    `You cannot take more than ${lt.maxConsecutiveDays} consecutive days for ${lt.name}`,
                    '409'
                );
            }

            // Check if the user has enough leave balance
            if (alreadyTakenLeaves + requestedDays > lt.maxDaysPerYear) {
                throw new AppError('You do not have enough leave balance', '409');
            }
        }

        // final create entity object
        let vacation = new Vacation().toEntity(
            {
                ...vacationRequest,
                requestedBy: contextUser.id
            },
            undefined,
            contextUser
        );

        // Override the entity's hardcoded (Sat/Sun-only) count with the working-day- and
        // holiday-aware count so the stored total matches the balance check and marked dates.
        // Persist the entity directly: super.add() would rebuild it from a request via
        // toEntity() and recompute totalDays with the old logic, discarding this override.
        vacation.totalDays = workingDates.length;

        return await this.vacationRepository.invokeDbOperationsWithResponse(vacation, Actions.Add);
    }

    public async get(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<IVacationRequest>): Promise<IDataSourceResponse<IVacationResponse>> {
        // first check if contextUser is userId exist means only employee can access his own attendance records
        if (contextUser && contextUser.id && contextUser.role === 'employee') {
            // Create or modify fetchRequest to filter by userId
            const modifiedFetchRequest: IFetchRequest<IVacationRequest> = {
                ...fetchRequest,
                queryOptionsRequest: {
                    ...fetchRequest?.queryOptionsRequest,
                    filtersRequest: [
                        // Keep existing filters if any
                        ...(fetchRequest?.queryOptionsRequest?.filtersRequest || []),
                        // Add requestedBy filter
                        {
                            field: 'requestedBy' as keyof IVacationRequest,
                            matchMode: FilterMatchModes.Equal,
                            operator: FilterOperators.And,
                            value: contextUser.id
                        },
                    ]
                },
            };
            
            return super.get(contextUser, modifiedFetchRequest);
        }

        // If no userId in context, return all records (admin/manager access)
        return super.get(contextUser, fetchRequest);
    }

    // Update Status of Vacation
    public async updateStatus(id: string, status: IVacationStatusRequest, contextUser: ITokenUser, rejectionReason?: string): Promise<IVacationResponse> {
        // Validate if vacation exists
        const vacation = await super.getById(id, contextUser);
        if (!vacation) {
            throw new AppError(`Vacation with ID ${id} does not exist`, '404');
        }

        // Check if the user has permission to update the status
        if (contextUser.role !== DefaultRoles.Admin) {
            throw new AppError('You do not have permission to update the status of this vacation', '403');
        }

        // first check if status not equls to pending
        if (vacation.status !== VacationStatus.PENDING) {
            throw new AppError(`You have already ${vacation.status} this vacation`, '409');
        }

        // Update the status and rejection reason if applicable
        vacation.status = status.status;
        if (status.status === VacationStatus.REJECTED) {
            vacation.rejectionReason = status.rejectionReason || rejectionReason;
            vacation.actionBy = contextUser.id;
            vacation.actionAt = new Date();
            
            // Clean up attendance records for rejected requests
            if (vacation.requestType === RequestType.LEAVE) {
                await this.cleanupAttendanceForRejectedLeave(vacation, contextUser);
            } else if (vacation.requestType === RequestType.REMOTE_WORK) {
                await this.cleanupAttendanceForRejectedRemoteWork(vacation, contextUser);
            }
        }

        if (status.status === VacationStatus.APPROVED) {
            vacation.actionBy = contextUser.id;
            vacation.actionAt = new Date();

            // Update attendance records for approved requests
            if (vacation.requestType === RequestType.LEAVE) {
                await this.updateAttendanceForApprovedLeave(vacation, contextUser);
            } else if (vacation.requestType === RequestType.REMOTE_WORK) {
                await this.updateAttendanceForApprovedRemoteWork(vacation, contextUser);
            }
        }

        const updated = await super.update(id, vacation, contextUser);

        // Notify the requester only on approval/rejection (the states they care about);
        // other transitions like CANCELLED/PENDING get no notification. Best-effort — never
        // let a notification failure roll back the status change. requestedBy is the
        // requesting User's id (FK to User).
        if (status.status === VacationStatus.APPROVED || status.status === VacationStatus.REJECTED) {
            try {
                const kind = vacation.requestType === RequestType.REMOTE_WORK ? "Remote work" : "Leave";
                const verb = status.status === VacationStatus.APPROVED ? "approved" : "rejected";
                const reason = status.status === VacationStatus.REJECTED && vacation.rejectionReason
                    ? ` Reason: ${vacation.rejectionReason}`
                    : "";
                await this.notificationService.createNotification(
                    vacation.requestedBy,
                    {
                        title: `${kind} request ${verb}`,
                        message: `Your ${kind.toLowerCase()} request has been ${verb}.${reason}`,
                        type: NotificationType.LEAVE_STATUS,
                    },
                    contextUser
                );
            } catch {
                // status change already committed; notification is non-critical.
            }
        }

        return updated;
    }

    public async leaveBalance(contextUser: ITokenUser): Promise<{ leaveBalances: Array<{ leaveTypeId: string; leaveTypeName: string; totalLeaves: number; usedLeaves: number; remainingLeaves: number; }> }> {
        // 1. Fetch all leave types for the company
        const leaveTypes = await this.leaveTypeService.get(contextUser);

        // 2. Fetch current-year leave requests for the user (APPROVED + PENDING consume balance)
        const currentYear = new Date().getFullYear();
        const yearStart = `${currentYear}-01-01`;
        const yearEnd = `${currentYear}-12-31`;

        const fetchRequest: IFetchRequest<IVacationRequest> = {
            queryOptionsRequest: {
                filtersRequest: [
                    {
                        field: 'requestedBy' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Equal,
                        operator: FilterOperators.And,
                        value: contextUser.id
                    },
                    {
                        field: 'requestType' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Equal,
                        operator: FilterOperators.And,
                        value: RequestType.LEAVE
                    },
                    {
                        field: 'status' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.In,
                        operator: FilterOperators.And,
                        values: [VacationStatus.APPROVED, VacationStatus.PENDING] as any
                    },
                    {
                        field: 'createdAt' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Between,
                        operator: FilterOperators.And,
                        rangeValues: { start: yearStart as any, end: yearEnd as any }
                    }
                ]
            }
        };
        const userVacationsResponse = await super.get(contextUser, fetchRequest);
        const userVacations = userVacationsResponse.data || [];

        // 3. Group by typeId and sum totalDays (only for leave requests)
        const usedDaysByType: { [typeId: string]: number } = {};
        userVacations.forEach((vacation: any) => {
            if (vacation.requestType === RequestType.LEAVE) {
                const typeId = vacation.typeId;
                const days = Number(vacation.totalDays) || 0;
                usedDaysByType[typeId] = (usedDaysByType[typeId] || 0) + days;
            }
        });

        // 4. Build the response: for each leave type, show total, used, and remaining
        const leaveBalances = (leaveTypes.data || []).map((leaveType: any) => {
            const used = usedDaysByType[leaveType.id] || 0;
            const total = leaveType.maxDaysPerYear || 0; // Adjust property if needed
            const remaining = total - used;
            return {
                leaveTypeId: leaveType.id,
                leaveTypeName: leaveType.name,
                totalLeaves: total,
                usedLeaves: used,
                remainingLeaves: remaining < 0 ? 0 : remaining
            };
        });

        // 5. Return only leaveBalances
        return {
            leaveBalances
        };
    }

    // Helper method to get all leave requests
    public async getLeaveRequests(contextUser: ITokenUser, fetchRequest?: IFetchRequest<IVacationRequest>): Promise<IDataSourceResponse<IVacationResponse>> {
        const modifiedFetchRequest: IFetchRequest<IVacationRequest> = {
            ...fetchRequest,
            queryOptionsRequest: {
                ...fetchRequest?.queryOptionsRequest,
                filtersRequest: [
                    ...(fetchRequest?.queryOptionsRequest?.filtersRequest || []),
                    {
                        field: 'requestType' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Equal,
                        operator: FilterOperators.And,
                        value: RequestType.LEAVE
                    }
                ]
            }
        };
        
        return this.get(contextUser, modifiedFetchRequest);
    }

    // Helper method to get all remote work requests
    public async getRemoteWorkRequests(contextUser: ITokenUser, fetchRequest?: IFetchRequest<IVacationRequest>): Promise<IDataSourceResponse<IVacationResponse>> {
        const modifiedFetchRequest: IFetchRequest<IVacationRequest> = {
            ...fetchRequest,
            queryOptionsRequest: {
                ...fetchRequest?.queryOptionsRequest,
                filtersRequest: [
                    ...(fetchRequest?.queryOptionsRequest?.filtersRequest || []),
                    {
                        field: 'requestType' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Equal,
                        operator: FilterOperators.And,
                        value: RequestType.REMOTE_WORK
                    }
                ]
            }
        };
        
        return this.get(contextUser, modifiedFetchRequest);
    }

    // Helper method to get remote work statistics
    public async getRemoteWorkStats(contextUser: ITokenUser): Promise<{ totalRemoteWorkDays: number; approvedRemoteWorkDays: number; pendingRemoteWorkDays: number; }> {
        const fetchRequest: IFetchRequest<IVacationRequest> = {
            queryOptionsRequest: {
                filtersRequest: [
                    {
                        field: 'requestedBy' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Equal,
                        operator: FilterOperators.And,
                        value: contextUser.id
                    },
                    {
                        field: 'requestType' as keyof IVacationRequest,
                        matchMode: FilterMatchModes.Equal,
                        operator: FilterOperators.And,
                        value: RequestType.REMOTE_WORK
                    }
                ]
            }
        };
        
        const remoteWorkResponse = await super.get(contextUser, fetchRequest);
        const remoteWorkRequests = remoteWorkResponse.data || [];

        let totalRemoteWorkDays = 0;
        let approvedRemoteWorkDays = 0;
        let pendingRemoteWorkDays = 0;

        remoteWorkRequests.forEach((request: any) => {
            const days = Number(request.totalDays) || 0;
            totalRemoteWorkDays += days;
            
            if (request.status === VacationStatus.APPROVED) {
                approvedRemoteWorkDays += days;
            } else if (request.status === VacationStatus.PENDING) {
                pendingRemoteWorkDays += days;
            }
        });

        return {
            totalRemoteWorkDays,
            approvedRemoteWorkDays,
            pendingRemoteWorkDays
        };
    }

// Helper method to check for overlapping requests
    private async checkForOverlappingRequests(
        userId: string, 
        fromDate: Date | string, 
        toDate: Date | string, 
        excludeId?: string
    ): Promise<Vacation | null> {
        const statusExclusions = Not(In([VacationStatus.CANCELLED, VacationStatus.REJECTED]));

        const whereConditions: any[] = [
            // Case 1: New request's fromDate falls within existing request
            { requestedBy: userId, fromDate: LessThanOrEqual(fromDate), toDate: MoreThanOrEqual(fromDate), status: statusExclusions },
            // Case 2: New request's toDate falls within existing request
            { requestedBy: userId, fromDate: LessThanOrEqual(toDate), toDate: MoreThanOrEqual(toDate), status: statusExclusions },
            // Case 3: New request completely covers existing request
            { requestedBy: userId, fromDate: MoreThanOrEqual(fromDate), toDate: LessThanOrEqual(toDate), status: statusExclusions },
            // Case 4: Existing request completely covers new request
            { requestedBy: userId, fromDate: LessThanOrEqual(fromDate), toDate: MoreThanOrEqual(toDate), status: statusExclusions }
        ];

        // If updating an existing record, exclude it from the check
        if (excludeId) {
            whereConditions.forEach(condition => {
                condition.id = Not(excludeId);
            });
        }

        return await this.vacationRepository.firstOrDefault({
            where: whereConditions
        });
    }

    // Override the update method to include overlap checking
    public async update(id: string, vacationRequest: IVacationRequest, contextUser: ITokenUser): Promise<IVacationResponse> {
        // Get the existing vacation record
        const existingVacation = await super.getById(id, contextUser);
        if (!existingVacation) {
            throw new AppError(`Vacation with ID ${id} does not exist`, '404');
        }

        // If dates are being updated, check for overlaps
        if (vacationRequest.fromDate || vacationRequest.toDate) {
            const fromDate = vacationRequest.fromDate || existingVacation.fromDate;
            const toDate = vacationRequest.toDate || existingVacation.toDate;

            // Check for overlapping requests (excluding the current record)
            const overlappingRequest = await this.checkForOverlappingRequests(
                contextUser.id,
                fromDate,
                toDate,
                id
            );

            if (overlappingRequest) {
                const existingType = overlappingRequest.requestType === RequestType.LEAVE ? 'leave' : 'remote work';
                const newType = (vacationRequest.requestType || existingVacation.requestType) === RequestType.LEAVE ? 'leave' : 'remote work';
                
                throw new AppError(
                    `Cannot update ${newType} request. You already have an overlapping ${existingType} request for the same period (${overlappingRequest.fromDate.toISOString().split('T')[0]} to ${overlappingRequest.toDate.toISOString().split('T')[0]})`, 
                    '409'
                );
            }
        }

        // Validate type ID requirement for leave requests
        const finalRequestType = vacationRequest.requestType || existingVacation.requestType;
        if (finalRequestType === RequestType.LEAVE) {
            const finalTypeId = vacationRequest.typeId || existingVacation.typeId;
            if (!finalTypeId) {
                throw new AppError('typeId is required for leave requests', '400');
            }
        }

        return super.update(id, vacationRequest, contextUser);
    }

    // Only admins can hard-delete vacation records
    public async delete(id: string, contextUser: ITokenUser): Promise<void> {
        if (contextUser.role !== DefaultRoles.Admin) {
            throw new AppError('You do not have permission to delete vacation records', '403');
        }
        await super.delete(id, contextUser);
    }

    // Public method to handle vacation cancellation (for approved leaves)
    public async cancelVacation(id: string, contextUser: ITokenUser): Promise<IVacationResponse> {
        // Get the existing vacation record
        const vacation = await super.getById(id, contextUser);
        if (!vacation) {
            throw new AppError(`Vacation with ID ${id} does not exist`, '404');
        }

        // Only the employee who requested the leave can cancel it
        if (vacation.requestedBy !== contextUser.id) {
            throw new AppError('You do not have permission to cancel this vacation', '403');
        }

        // Only approved leaves can be cancelled
        if (vacation.status !== VacationStatus.APPROVED) {
            throw new AppError('Only approved vacations can be cancelled', '409');
        }

        // Update status to cancelled
        vacation.status = VacationStatus.CANCELLED;
        vacation.actionBy = contextUser.id;
        vacation.actionAt = new Date();

        // Clean up attendance records for cancelled requests
        if (vacation.requestType === RequestType.LEAVE) {
            await this.cleanupAttendanceForRejectedLeave(vacation, contextUser);
        } else if (vacation.requestType === RequestType.REMOTE_WORK) {
            await this.cleanupAttendanceForRejectedRemoteWork(vacation, contextUser);
        }

        return super.update(id, vacation, contextUser);
    }

    // Private method to update attendance records when leave is approved
    private async updateAttendanceForApprovedLeave(vacation: IVacationResponse, contextUser: ITokenUser): Promise<void> {
        try {
            // Generate all dates in the vacation period (excluding weekends)
            const leaveDates = await this.generateLeaveDates(vacation.fromDate, vacation.toDate, vacation.requestedBy, contextUser);
            
            // Process each leave date
            for (const leaveDate of leaveDates) {
                await this.updateOrCreateAttendanceRecord(vacation.requestedBy, leaveDate, vacation.id, contextUser);
            }
        } catch (error) {
            console.error('Error updating attendance for approved leave:', error);
            throw new AppError('Failed to update attendance records for approved leave', '500');
        }
    }

    // Private method to update attendance records when remote work is approved
    private async updateAttendanceForApprovedRemoteWork(vacation: IVacationResponse, contextUser: ITokenUser): Promise<void> {
        try {
            // Generate all dates in the remote work period (excluding weekends)
            const remoteDates = await this.generateLeaveDates(vacation.fromDate, vacation.toDate, vacation.requestedBy, contextUser);
            
            // Process each remote work date
            for (const remoteDate of remoteDates) {
                await this.updateOrCreateAttendanceRecordForRemoteWork(vacation.requestedBy, remoteDate, vacation.id, contextUser);
            }
        } catch (error) {
            console.error('Error updating attendance for approved remote work:', error);
            throw new AppError('Failed to update attendance records for approved remote work', '500');
        }
    }

    // Format a date as local YYYY-MM-DD (to match how public-holiday dates are stored).
    private static toYmd(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    // Pure: the working dates within [from, to], given the working weekdays
    // (1=Mon..7=Sun) and a set of YYYY-MM-DD holiday strings to exclude.
    private static computeWorkingDates(fromDate: Date, toDate: Date, workingDows: Set<number>, holidays: Set<string>): Date[] {
        const dates: Date[] = [];
        const end = new Date(toDate);
        for (let date = new Date(fromDate); date <= end; date.setDate(date.getDate() + 1)) {
            const isoDow = date.getDay() === 0 ? 7 : date.getDay(); // JS 0=Sun -> 7
            if (workingDows.has(isoDow) && !holidays.has(VacationService.toYmd(date))) {
                dates.push(new Date(date));
            }
        }
        return dates;
    }

    // The company's working weekdays for a department (department-specific overrides
    // company default), falling back to Mon-Fri when nothing is configured.
    private async resolveWorkingDows(departmentId: string | undefined, contextUser: ITokenUser): Promise<Set<number>> {
        if (departmentId) {
            const effective = await this.workingDaysService.getEffectiveWorkingDaysForDepartment(departmentId, contextUser);
            if (effective.length > 0) {
                return new Set(effective.filter(d => d.isWorkingDay).map(d => d.dayOfWeek));
            }
        }
        return new Set([1, 2, 3, 4, 5]);
    }

    // Public-holiday dates (YYYY-MM-DD) applying to the employee: company-wide plus their department.
    private async getHolidayDateSet(departmentId: string | undefined, contextUser: ITokenUser): Promise<Set<string>> {
        const holidays = await this.publicHolidayRepository.getCompanyRecords(contextUser.companyId);
        const set = new Set<string>();
        for (const h of holidays) {
            // PublicHoliday.departmentId is mistyped as number but holds the department id;
            // compare as strings. A holiday with no department applies company-wide.
            const applies = !h.departmentId || (departmentId !== undefined && String(h.departmentId) === departmentId);
            if (!applies) continue;
            for (const d of (h.dates ?? [])) set.add(String(d).slice(0, 10));
        }
        return set;
    }

    private async getDepartmentIdForUser(userId: string): Promise<string | undefined> {
        const employee = await this.employeeRepository.firstOrDefault({ where: { userId } });
        return employee?.departmentId;
    }

    // Working dates in a range, excluding configured non-working days and public holidays.
    private async getWorkingDatesInRange(fromDate: Date, toDate: Date, departmentId: string | undefined, contextUser: ITokenUser): Promise<Date[]> {
        const [workingDows, holidays] = await Promise.all([
            this.resolveWorkingDows(departmentId, contextUser),
            this.getHolidayDateSet(departmentId, contextUser),
        ]);
        return VacationService.computeWorkingDates(new Date(fromDate), new Date(toDate), workingDows, holidays);
    }

    // Generate the leave/remote-work dates to mark attendance for, respecting the
    // employee's configured working days and public holidays.
    private async generateLeaveDates(fromDate: Date, toDate: Date, requestedBy: string, contextUser: ITokenUser): Promise<Date[]> {
        const departmentId = await this.getDepartmentIdForUser(requestedBy);
        return this.getWorkingDatesInRange(fromDate, toDate, departmentId, contextUser);
    }

    // Helper method to update or create attendance record for a specific date
    private async updateOrCreateAttendanceRecord(userId: string, date: Date, vacationId: string, contextUser: ITokenUser): Promise<void> {
        await this.createOrUpdateAttendanceRecord(userId, date, contextUser, {
            status: AttendanceStatus.ON_LEAVE,
            vacationId: vacationId,
            notes: 'On approved leave',
            lockWorkingHours: 0
        });
    }

    // Helper method to update or create attendance record for remote work
    private async updateOrCreateAttendanceRecordForRemoteWork(userId: string, date: Date, remoteWorkId: string, contextUser: ITokenUser): Promise<void> {
        await this.createOrUpdateAttendanceRecord(userId, date, contextUser, {
            status: AttendanceStatus.DEFAULT,
            remoteWorkId: remoteWorkId,
            isRemote: true,
            notes: 'Approved for remote work'
        });
    }

    // Private method to clean up attendance records when leave is rejected or cancelled
    private async cleanupAttendanceForRejectedLeave(vacation: IVacationResponse, contextUser: ITokenUser): Promise<void> {
        try {
            // Generate all dates in the vacation period (excluding weekends)
            const leaveDates = await this.generateLeaveDates(vacation.fromDate, vacation.toDate, vacation.requestedBy, contextUser);
            
            // Process each leave date
            for (const leaveDate of leaveDates) {
                await this.resetAttendanceRecord(vacation.requestedBy, leaveDate, vacation.id, contextUser);
            }
        } catch (error) {
            console.error('Error cleaning up attendance for rejected leave:', error);
            // Don't throw error for cleanup operations to avoid blocking the rejection process
        }
    }

    // Private method to clean up attendance records when remote work is rejected or cancelled
    private async cleanupAttendanceForRejectedRemoteWork(vacation: IVacationResponse, contextUser: ITokenUser): Promise<void> {
        try {
            // Generate all dates in the remote work period (excluding weekends)
            const remoteDates = await this.generateLeaveDates(vacation.fromDate, vacation.toDate, vacation.requestedBy, contextUser);
            
            // Process each remote work date
            for (const remoteDate of remoteDates) {
                await this.resetAttendanceRecordForRemoteWork(vacation.requestedBy, remoteDate, vacation.id, contextUser);
            }
        } catch (error) {
            console.error('Error cleaning up attendance for rejected remote work:', error);
            // Don't throw error for cleanup operations to avoid blocking the rejection process
        }
    }

    // Helper method to reset attendance record back to default status
    private async resetAttendanceRecord(userId: string, date: Date, vacationId: string, contextUser: ITokenUser): Promise<void> {
        try {
            // Find attendance record that was marked as leave for this vacation
            // Look for any attendance record with this vacationId, regardless of status
            const existingAttendance = await this.attendanceRepository.firstOrDefault({
                where: {
                    userId: userId,
                    date: date,
                    vacationId: vacationId
                }
            });

            if (existingAttendance) {
                // Reset the attendance record to default status using partialUpdate with explicit null values
                const updateData = {
                    status: AttendanceStatus.DEFAULT,
                    vacationId: null,
                    notes: "",
                    vacation: null
                };

                await this.attendanceRepository.partialUpdate(
                    existingAttendance.id,
                    updateData as any,
                    contextUser
                );
            }
        } catch (error) {
            console.error(`Error resetting attendance record for date ${date.toISOString().split('T')[0]}:`, error);
        }
    }

    // Helper method to reset attendance record back to default status from remote work
    private async resetAttendanceRecordForRemoteWork(userId: string, date: Date, remoteWorkId: string, contextUser: ITokenUser): Promise<void> {
        try {
            // Find existing attendance record for this date
            const existingAttendance = await this.attendanceRepository.firstOrDefault({
                where: {
                    userId: userId,
                    date: date,
                    remoteWorkId: remoteWorkId
                }
            });

            if (existingAttendance) {
                // Reset remote work specific fields
                existingAttendance.remoteWorkId = undefined;
                existingAttendance.isRemote = false;
                existingAttendance.status = AttendanceStatus.DEFAULT;
                
                // Update notes to remove remote work reference
                if (existingAttendance.notes?.includes('Approved for remote work')) {
                    existingAttendance.notes = existingAttendance.notes
                        .replace(' - Approved for remote work', '')
                        .replace('Approved for remote work', '')
                        .trim() || undefined;
                }

                await this.attendanceRepository.partialUpdate(
                    existingAttendance.id,
                    existingAttendance,
                    contextUser
                );
            }
        } catch (error) {
            console.error(`Error resetting attendance record for remote work date ${date.toISOString().split('T')[0]}:`, error);
            // Don't throw error for individual record cleanup
        }
    }

    // Helper method to create or update attendance record with shift information
    private async createOrUpdateAttendanceRecord(
        userId: string, 
        date: Date, 
        contextUser: ITokenUser,
        options: {
            status: AttendanceStatus;
            vacationId?: string;
            remoteWorkId?: string;
            isRemote?: boolean;
            notes: string;
            lockWorkingHours?: number;
        }
    ): Promise<void> {
        try {
            // Get employee record with shift details directly from repository
            const employee = await this.employeeRepository.firstOrDefault({
                where: {
                    userId: userId,
                    companyId: contextUser.companyId,
                    active: true
                },
                relations: {
                    shift: true
                }
            });
            
            // Try to find existing attendance record for this date
            const existingAttendance = await this.attendanceRepository.firstOrDefault({
                where: {
                    userId: userId,
                    date: date
                }
            });

            // Helper function to set shift-related fields (eliminates duplication)
            const setShiftFields = (attendance: any) => {
                if (employee?.shiftId && employee?.shift) {
                    attendance.shiftId = employee.shiftId;
                    attendance.totalWorkingHours = employee.shift.workingHours / 60; // Convert minutes to hours
                    
                    // Set minimum required working hours based on status
                    if (options.status === AttendanceStatus.ON_LEAVE) {
                        attendance.minimumRequiredWorkingHour = 0; // Set to 0 for vacation days
                    } else if (options.isRemote) {
                        attendance.minimumRequiredWorkingHour = employee.shift.getMinimumRequiredHours() / 60; // Convert minutes to hours
                    }
                    
                    console.log('Shift fields set successfully:', {
                        shiftId: attendance.shiftId,
                        totalWorkingHours: attendance.totalWorkingHours,
                        minimumRequiredWorkingHour: attendance.minimumRequiredWorkingHour
                    });
                } else {
                    console.log('No shift information found for employee');
                }
            };

            if (existingAttendance) {
                console.log('Updating existing attendance record:', existingAttendance.id);
                // Update existing record
                existingAttendance.status = options.status;
                existingAttendance.notes = options.notes;
                
                // Set vacation or remote work references
                if (options.vacationId) {
                    existingAttendance.vacationId = options.vacationId;
                }
                if (options.remoteWorkId) {
                    existingAttendance.remoteWorkId = options.remoteWorkId;
                }
                if (options.isRemote !== undefined) {
                    existingAttendance.isRemote = options.isRemote;
                }
                if (options.lockWorkingHours !== undefined) {
                    existingAttendance.lockWorkingHours = options.lockWorkingHours;
                }
                
                // Set shift and working hours
                setShiftFields(existingAttendance);

                console.log('Updated attendance record before save:', existingAttendance);
                await this.attendanceRepository.partialUpdate(
                    existingAttendance.id,
                    existingAttendance,
                    contextUser
                );
                console.log('Existing attendance record updated successfully');
            } else {
                console.log('Creating new attendance record');
                // Create new attendance record
                const newAttendance = new Attendance().toEntity(
                    {
                        userId: userId,
                        date: date,
                        status: options.status,
                        notes: options.notes,
                        lockWorkingHours: options.lockWorkingHours || 0
                    } as any,
                    undefined,
                    contextUser
                );

                // Set vacation or remote work references
                if (options.vacationId) {
                    newAttendance.vacationId = options.vacationId;
                }
                if (options.remoteWorkId) {
                    newAttendance.remoteWorkId = options.remoteWorkId;
                }
                if (options.isRemote !== undefined) {
                    newAttendance.isRemote = options.isRemote;
                }
                
                // Set shift and working hours
                setShiftFields(newAttendance);

                console.log('New attendance record before save:', newAttendance);
                await this.attendanceRepository.invokeDbOperations(newAttendance, Actions.Add);
                console.log('New attendance record created successfully');
            }
        } catch (error) {
            console.error(`Error creating/updating attendance record for date ${date.toISOString().split('T')[0]}:`, error);
            throw error;
        }
    }
}
