import moment from 'moment-timezone';

import { inject, injectable } from "tsyringe";
import { AttendanceRepository, EmployeeRepository, AttendanceSummaryRepository, VacationRepository, PublicHolidayRepository, UserRepository } from "../dal";
import { IsNull, In, LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";
import { Attendance, AttendanceSummary } from "../entities";
import { Actions, AttendanceStatus, FilterMatchModes, FilterOperators, IAttendanceRequest, IAttendanceResponse, ICheckInRequest, ICheckOutRequest, IDataSourceResponse, IFetchRequest, IStatusRequest, ITokenUser, IAttendanceStatsResponse, EmployeeStatus, PresentStatus, DayName, IAttendanceStatusResponse, RequestType, VacationStatus, NotificationType, IBiometricSyncRequest, IBiometricSyncResponse, BiometricAttendanceStatus, IBiometricBulkSyncRequest, IBiometricBulkSyncResponse, IBiometricBulkSyncEmployeeResult } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";
import { WorkingDaysService } from "./working-days-service";
import { NotificationService } from "./notification-service";
import { hasAdminAccess } from "../middlewares/permissions";
import { DefaultRoles } from "../constants/roles";
import {
    fetchBiometricAttendance,
    parse12HourTimeTo24Hour,
    diffMinutesAcrossMidnight,
    formatMinutesAsHoursAndMinutes,
    sanitizeEmployeeNameForBiometricApi,
    BIOMETRIC_EMPLOYEE_NOT_ENROLLED,
} from "../utility/biometric-attendance-utility";
import { BUSINESS_TIMEZONE, DEVICE_TIMEZONE, convertDeviceTimeToBusiness } from "../utility/timezone-utility";
import { sendLateArrivalEmployeeEmail, sendLateArrivalAdminEmail } from "../utility/mail-utility";

// The company's official shift is fixed at 8.5 hours (8:30 AM – 5:00 PM
// BUSINESS_TIMEZONE) for the purposes of this integration — independent of whatever
// Shift entity an employee is individually assigned, since the biometric feed doesn't
// carry shift context.
const STANDARD_SHIFT_MINUTES = 8.5 * 60;
const ON_TIME_TOLERANCE_MINUTES = 5;

// Purely about whether the Late Arrival alert fires - completely separate from
// ON_TIME_TOLERANCE_MINUTES above, which classifies OVERTIME/ON_TIME/UNDERTIME from
// actual hours worked. A late-but-within-grace check-in can still end up UNDERTIME
// (if they leave on time) or ON_TIME (if they make up the minutes by staying later) -
// the alert grace period must never feed into that hours math.
const LATE_ARRIVAL_ALERT_GRACE_MINUTES = 15;

// A pending check-in/out reminder for today, surfaced to the admin reminders view.
export interface IAttendanceReminder {
    userId: string;
    employeeName: string;
    reminderType: 'Check-in' | 'Check-out';
    shiftName?: string;
    dueTime?: string; // HH:MM (24h)
    date: string;     // YYYY-MM-DD
}

@injectable()
export class AttendanceService extends Service<Attendance, IAttendanceResponse, IAttendanceRequest> {
    constructor(
        @inject('AttendanceRepository') private readonly attendanceRepository: AttendanceRepository,
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('WorkingDaysService') private readonly workingDaysService: WorkingDaysService,
        @inject('AttendanceSummaryRepository') private readonly attendanceSummaryRepository: AttendanceSummaryRepository,
        @inject('VacationRepository') private readonly vacationRepository: VacationRepository,
        @inject('PublicHolidayRepository') private readonly publicHolidayRepository: PublicHolidayRepository,
        @inject('NotificationService') private readonly notificationService: NotificationService,
        @inject('UserRepository') private readonly userRepository: UserRepository
    ) {
        super(attendanceRepository, () => new Attendance())
    }

    /**
     * Today's pending check-in/out reminders for the company.
     * Derived from today's attendance rows (created by the daily cron): a row with
     * no check-in → "Check-in"; checked-in but not checked-out → "Check-out".
     * Employees on leave / holiday / a day off are not expected to work, so skipped.
     */
    public async getPendingReminders(contextUser: ITokenUser): Promise<IAttendanceReminder[]> {
        const todayStr = moment().tz(BUSINESS_TIMEZONE).format('YYYY-MM-DD');

        // `date` is a Postgres `date` column — match with the YYYY-MM-DD string, not a
        // JS Date (which serializes to a full timestamp and misses the equality).
        const records = await this.attendanceRepository.getCompanyRecords(contextUser.companyId, {
            where: { date: todayStr as any },
            relations: { user: true, shift: true }
        });

        const excluded = [AttendanceStatus.ON_LEAVE, AttendanceStatus.HOLIDAY, AttendanceStatus.DAY_OFF];
        const reminders: IAttendanceReminder[] = [];

        for (const r of records) {
            if (excluded.includes(r.status)) continue;

            const name = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim()
                || r.user?.userName
                || 'Employee';

            if (!r.checkInTime) {
                reminders.push({
                    userId: r.userId,
                    employeeName: name,
                    reminderType: 'Check-in',
                    shiftName: r.shift?.name,
                    dueTime: r.shift?.startTime?.slice(0, 5),
                    date: todayStr,
                });
            } else if (!r.checkOutTime) {
                reminders.push({
                    userId: r.userId,
                    employeeName: name,
                    reminderType: 'Check-out',
                    shiftName: r.shift?.name,
                    dueTime: r.shift?.endTime?.slice(0, 5),
                    date: todayStr,
                });
            }
        }

        return reminders;
    }

    /**
     * Deliver reminder notifications (in-app + best-effort email, via NotificationService)
     * to the pending employees. Optionally narrow to specific userIds (e.g. one row).
     */
    public async sendReminders(contextUser: ITokenUser, userIds?: string[]): Promise<{ sent: number }> {
        let pending = await this.getPendingReminders(contextUser);
        if (userIds && userIds.length) {
            const set = new Set(userIds);
            pending = pending.filter(p => set.has(p.userId));
        }

        let sent = 0;
        for (const p of pending) {
            const isCheckIn = p.reminderType === 'Check-in';
            await this.notificationService.createNotification(
                p.userId,
                {
                    title: isCheckIn ? 'Check-in reminder' : 'Check-out reminder',
                    message: isCheckIn
                        ? `Please remember to check in for today${p.dueTime ? ` — your shift starts at ${p.dueTime}.` : '.'}`
                        : `Please remember to check out for today${p.dueTime ? ` — your shift ends at ${p.dueTime}.` : '.'}`,
                    type: isCheckIn ? NotificationType.CHECK_IN_REMINDER : NotificationType.CHECK_OUT_REMINDER,
                },
                contextUser
            );
            sent++;
        }

        return { sent };
    }

    private async defaultAttendanceRecord(contextUser: ITokenUser): Promise<{ created: number; existing: number }> {
        const today = new Date(moment().tz(BUSINESS_TIMEZONE).format('YYYY-MM-DD'));
        const todayStr = moment().tz(BUSINESS_TIMEZONE).format('YYYY-MM-DD');

        const employees = await this.employeeRepository.getCompanyRecords(contextUser.companyId, {
            where: {
                active: true,
                status: In([EmployeeStatus.PERMANENT, EmployeeStatus.CONTRACT, EmployeeStatus.PROBATION])
            },
            relations: { shift: true }
        });

        if (employees.length === 0) return { created: 0, existing: 0 };

        const employeeUserIds = employees.map(emp => emp.userId);

        const existingRecords = await this.attendanceRepository.getCompanyRecords(contextUser.companyId, {
            where: { userId: In(employeeUserIds), date: today }
        });
        const existingSet = new Set(existingRecords.map(r => r.userId));

        // Public holidays for today, grouped by department
        const allHolidays = await this.publicHolidayRepository.getCompanyRecords(contextUser.companyId, {
            where: { active: true, deleted: false }
        });
        const holidayByDept = new Map<string, any>();
        for (const holiday of allHolidays) {
            if (holiday.dates.includes(todayStr)) {
                holidayByDept.set(holiday.departmentId, holiday);
            }
        }

        // Approved leaves covering today for all employees
        const approvedLeaves = await this.vacationRepository.where({
            where: {
                companyId: contextUser.companyId,
                requestedBy: In(employeeUserIds),
                status: VacationStatus.APPROVED,
                requestType: RequestType.LEAVE,
                fromDate: LessThanOrEqual(today) as any,
                toDate: MoreThanOrEqual(today) as any,
                active: true
            }
        });
        const leaveByUser = new Map<string, any>();
        for (const leave of approvedLeaves) {
            leaveByUser.set(leave.requestedBy, leave);
        }

        const entitiesToCreate: Attendance[] = [];

        for (const employee of employees) {
            if (existingSet.has(employee.userId)) continue;

            let status = AttendanceStatus.DEFAULT;
            let vacationId: string | undefined;
            let publicHolidayId: string | undefined;
            let totalWorkingHours: number | undefined;
            let minimumRequiredWorkingHour: number | undefined;

            // Priority 1: Public Holiday
            const holiday = holidayByDept.get(employee.departmentId);
            if (holiday) {
                status = AttendanceStatus.HOLIDAY;
                publicHolidayId = holiday.id;
                totalWorkingHours = 0;
                minimumRequiredWorkingHour = 0;
            }
            // Priority 2: Approved Leave
            else if (leaveByUser.has(employee.userId)) {
                const leave = leaveByUser.get(employee.userId);
                status = AttendanceStatus.ON_LEAVE;
                vacationId = leave.id;
                totalWorkingHours = 0;
                minimumRequiredWorkingHour = 0;
            }
            // Priority 3: Day Off
            else {
                const isWorkingDay = await this.isWorkingDay(today, employee.departmentId, contextUser);
                if (!isWorkingDay) {
                    status = AttendanceStatus.DAY_OFF;
                    totalWorkingHours = 0;
                    minimumRequiredWorkingHour = 0;
                } else {
                    // Priority 4: Regular working day — DEFAULT with shift hours
                    status = AttendanceStatus.DEFAULT;
                    if (employee.shift) {
                        totalWorkingHours = Math.round((employee.shift.workingHours / 60) * 100) / 100;
                        minimumRequiredWorkingHour = Math.round(
                            ((employee.shift.workingHours - employee.shift.marginTime) / 60) * 100
                        ) / 100;
                    }
                }
            }

            const entity = new Attendance().toEntity(
                {
                    userId: employee.userId,
                    shiftId: employee.shiftId,
                    date: today,
                    status,
                    vacationId,
                    publicHolidayId,
                    totalWorkingHours,
                    minimumRequiredWorkingHour
                },
                undefined,
                { ...contextUser }
            );
            entitiesToCreate.push(entity);
        }

        if (entitiesToCreate.length === 0) {
            return { created: 0, existing: existingRecords.length };
        }

        try {
            await this.attendanceRepository.invokeDbOperationsRange(entitiesToCreate, Actions.Add);
        } catch (error: any) {
            // Ignore duplicate key violations from concurrent requests
            if (!error?.message?.includes('duplicate key')) throw error;
        }

        return { created: entitiesToCreate.length, existing: existingRecords.length };
    }

    /**
     * Enhanced status method that provides comprehensive attendance information
     * 
     * Returns:
     * - Basic attendance record (existing or created)
     * - Working day status for the employee's department
     * - Leave information if employee has approved leave
     * - Expected check-in/check-out times from shift
     * - Permission flags for check-in/check-out actions
     * - Shift and working day details
     * 
     * This method is designed to be called by frontend before allowing attendance actions
     */
    public async status(contextUser: ITokenUser, request: IStatusRequest): Promise<IAttendanceStatusResponse> {
        // Get employee details with shift and department information
        const employee = await this.getEmployeeWithDetails(contextUser.id!, contextUser);
        
        // Try to find existing attendance record with vacation relation
        let attendanceRecord = await this.attendanceRepository.firstOrDefault({
            where: {
                userId: contextUser.id,
                date: request.date
            },
            relations: {
                shift: true,
                user: true,
                vacation: true,
                breaks: true
            }
        });

        // Overnight shift check: if today has no open check-in, look for an open
        // check-in from yesterday (employee checked in yesterday, hasn't checked out yet)
        if (!attendanceRecord?.checkInTime || attendanceRecord.checkOutTime) {
            const yesterday = new Date(request.date);
            yesterday.setDate(yesterday.getDate() - 1);

            const overnightRecord = await this.attendanceRepository.firstOrDefault({
                where: {
                    userId: contextUser.id,
                    date: yesterday,
                    checkInTime: Not(IsNull()),
                    checkOutTime: IsNull()
                },
                relations: {
                    shift: true,
                    user: true,
                    vacation: true,
                    breaks: true
                }
            });

            if (overnightRecord) {
                // Return yesterday's open check-in — employee is still in the middle of an overnight shift
                return this.buildStatusResponse(overnightRecord, employee, request.date, contextUser);
            }
        }

        // If not found, create a new attendance record with default status and shift ID
        if (!attendanceRecord) {
            // Create attendance request with shift-based working hour requirements
            const attendanceRequest: IAttendanceRequest = {
                userId: contextUser.id ?? (() => { throw new AppError('User ID is required', '400'); })(),
                shiftId: employee.shiftId, // Store employee's shift ID
                date: request.date,
                status: AttendanceStatus.DEFAULT  // Default status
            };

            // Calculate shift-based working hour requirements if shift is available
            if (employee.shift) {
                // Convert shift working hours from minutes to hours
                attendanceRequest.totalWorkingHours = Math.round((employee.shift.workingHours / 60) * 100) / 100;
                // Calculate minimum required hours (excluding margin time)
                attendanceRequest.minimumRequiredWorkingHour = Math.round(((employee.shift.workingHours - employee.shift.marginTime) / 60) * 100) / 100;
            }

            const attendanceEntity = new Attendance().toEntity(
                attendanceRequest,
                undefined,
                { ...contextUser }
            );

            attendanceRecord = await this.attendanceRepository.invokeDbOperations(attendanceEntity, Actions.Add);
        }

        // Mark DAY_OFF if not a working day and nothing has happened yet
        const isRegularWorkingDay = await this.isWorkingDay(request.date, employee.departmentId, contextUser);
        if (!isRegularWorkingDay && !attendanceRecord.checkInTime
            && attendanceRecord.status !== AttendanceStatus.ON_LEAVE
            && attendanceRecord.status !== AttendanceStatus.HOLIDAY) {
            attendanceRecord.status = AttendanceStatus.DAY_OFF;
            attendanceRecord.totalWorkingHours = 0;
            attendanceRecord.minimumRequiredWorkingHour = 0;
            await this.attendanceRepository.partialUpdate(
                attendanceRecord.id,
                { status: AttendanceStatus.DAY_OFF, totalWorkingHours: 0, minimumRequiredWorkingHour: 0 },
                contextUser
            );
        }

        return this.buildStatusResponse(attendanceRecord, employee, request.date, contextUser);
    }

    private async buildStatusResponse(
        attendanceRecord: Attendance,
        employee: any,
        queryDate: Date,
        contextUser: ITokenUser
    ): Promise<IAttendanceStatusResponse> {
        const hasLeave = attendanceRecord.status === AttendanceStatus.ON_LEAVE && !!attendanceRecord.vacationId;
        const leaveInfo = hasLeave ? {
            hasLeave: true,
            leaveType: attendanceRecord.vacation?.requestType || 'LEAVE',
            leaveStatus: 'APPROVED',
            leaveId: attendanceRecord.vacationId,
            startDate: attendanceRecord.vacation?.fromDate,
            endDate: attendanceRecord.vacation?.toDate
        } : { hasLeave: false };

        const isWorkingDay = await this.determineWorkingDayStatus(queryDate, employee.departmentId, hasLeave, attendanceRecord, contextUser);
        const isRegularWorkingDay = await this.isWorkingDay(queryDate, employee.departmentId, contextUser);
        const isHoliday = attendanceRecord.status === AttendanceStatus.HOLIDAY && !!attendanceRecord.publicHolidayId;

        const dayOfWeek = moment(queryDate).isoWeekday();
        const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        const dayName = dayNames[dayOfWeek - 1];

        const { canCheckIn, canCheckOut } = this.determineActionPermissions(attendanceRecord, isWorkingDay, hasLeave);

        return {
            ...attendanceRecord.toResponse(),
            statusInfo: {
                isWorkingDay,
                expectedCheckInTime: employee.shift?.startTime,
                expectedCheckOutTime: employee.shift?.endTime,
                canCheckIn,
                canCheckOut,
                leaveInfo,
                shiftInfo: employee.shift ? {
                    shiftName: employee.shift.name,
                    shiftType: employee.shift.shiftType,
                    workingHours: employee.shift.workingHours,
                    marginTime: employee.shift.marginTime,
                    breakDuration: employee.shift.breakDuration
                } : undefined,
                workingDayInfo: {
                    dayName,
                    dayOfWeek,
                    isCompanyWorkingDay: isRegularWorkingDay,
                    isDepartmentWorkingDay: isRegularWorkingDay,
                    isPublicHoliday: isHoliday
                }
            }
        };
    }

    public async checkIn(contextUser: ITokenUser, request: ICheckInRequest): Promise<IAttendanceResponse> {
        // Get employee details with shift and department information
        const employee = await this.getEmployeeWithDetails(contextUser.id!, contextUser);
        
        // Try to find existing attendance record with vacation relation
        let existingAttendance = await this.attendanceRepository.firstOrDefault({
            where: {
                userId: contextUser.id,
                date: request.date
            },
            relations: {
                vacation: true,
                publicHoliday: true,
                remoteWork: true
            }
        });

        if (existingAttendance) {
            if (existingAttendance.checkInTime && !existingAttendance.checkOutTime) {
                throw new AppError('User has already checked in for this date. Please check out first.', '400');
            }

            if (existingAttendance.checkInTime && existingAttendance.checkOutTime) {
                throw new AppError('User has already completed attendance for this date (both check-in and check-out done).', '400');
            }

            if (!existingAttendance.checkInTime) {
                // Calculate lateness if shift is available
                let lateMinutes = 0;
                if (employee.shift?.startTime) {
                    lateMinutes = this.calculateLateness(request.checkInTime, employee.shift.startTime);
                }

                existingAttendance.checkIn(request.date, request.checkInTime);
                existingAttendance.shiftId = employee.shiftId; // Store shift ID
                existingAttendance.lateMinutes = lateMinutes;
                existingAttendance.status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

                // Update shift-based working hour requirements
                if (employee.shift) {
                    existingAttendance.updateShiftWorkingHours(employee.shift);
                }

                let updateResponse = await this.attendanceRepository.partialUpdate(
                    existingAttendance.id,
                    {
                        ...existingAttendance
                    },
                    { ...contextUser }
                );

                if (employee.shift?.startTime) {
                    await this.maybeSendLateArrivalAlert(
                        employee,
                        lateMinutes,
                        request.checkInTime,
                        moment(request.date).format('YYYY-MM-DD'),
                        employee.shift.startTime,
                        contextUser
                    );
                }

                return updateResponse.toResponse();
            }
        }

        // Calculate lateness if shift is available
        let lateMinutes = 0;
        let status = AttendanceStatus.PRESENT;
        
        if (employee.shift?.startTime) {
            lateMinutes = this.calculateLateness(request.checkInTime, employee.shift.startTime);
            if (lateMinutes > 0) {
                status = AttendanceStatus.LATE;
            }
        }

        // Create new entity with shift ID and calculated lateness
        let attendanceEntity = new Attendance().toEntity(
            {
                userId: contextUser.id ?? (() => { throw new AppError('User ID is required', '400'); })(),
                shiftId: employee.shiftId, // Store employee's shift ID
                date: request.date,
                checkInTime: request.checkInTime,
                status: status, // Set status based on lateness
                presentStatus: PresentStatus.CHECK_IN,
                lateMinutes: lateMinutes
            },
            undefined,
            { ...contextUser }
        );

        // Update shift-based working hour requirements
        if (employee.shift) {
            attendanceEntity.updateShiftWorkingHours(employee.shift);
        }

        let checkInResponse = await this.attendanceRepository.invokeDbOperations(attendanceEntity, Actions.Add);

        if (employee.shift?.startTime) {
            await this.maybeSendLateArrivalAlert(
                employee,
                lateMinutes,
                request.checkInTime,
                moment(request.date).format('YYYY-MM-DD'),
                employee.shift.startTime,
                contextUser
            );
        }

        return checkInResponse.toResponse();
    }

    public async checkOut(contextUser: ITokenUser, request: ICheckOutRequest): Promise<IAttendanceResponse> {

        // Get the date and employee id from the request
        let latestAttendance = await this.attendanceRepository.firstOrDefault({
            where: {
                userId: contextUser.id,
                date: request.date
            },
            relations: {
                shift: true, // Load shift information for calculations
                breaks: true // Needed so break time is subtracted from working hours
            }
        });

        if (!latestAttendance) {
            throw new AppError('No check-in record found for the given user and date.', '404');
        }

        // If attendance record does not exist for the user on the given date, throw an error user not checked in
        if (!latestAttendance || !latestAttendance.checkInTime) {
            throw new AppError('User has not checked in for this date. Please check in first.', '400');
        }

        // If check-out time is already set, throw an error
        if (latestAttendance.checkOutTime && latestAttendance.presentStatus) {
            throw new AppError('User has already checked out for this date.', '400');
        }

        // If check-in time is set but present status is Break, throw an error
        if (latestAttendance.checkInTime && latestAttendance.presentStatus === PresentStatus.ON_BREAK){
            throw new AppError('User is currently on break and cannot check out.', '400');
        }

        // Get employee details for shift validation
        const employee = await this.getEmployeeWithDetails(contextUser.id!, contextUser);

        // Update shift-based working hour requirements if not already set
        if (employee.shift && (!latestAttendance.totalWorkingHours || !latestAttendance.minimumRequiredWorkingHour)) {
            latestAttendance.updateShiftWorkingHours(employee.shift);
        }

        // Call entity's checkOut method to update time and calculate working hours
        latestAttendance.checkOut(request.checkOutTime);

        // Update the record with calculated values - only update specific fields to avoid type issues
        let checkOutResponse = await this.attendanceRepository.partialUpdate(
            latestAttendance.id,
            {
                checkOutTime: latestAttendance.checkOutTime,
                presentStatus: latestAttendance.presentStatus,
                lockWorkingHours: latestAttendance.lockWorkingHours,
                totalBreakTime: latestAttendance.totalBreakTime,
                earlyLeaveMinutes: latestAttendance.earlyLeaveMinutes
            },
            { ...contextUser }
        );

        return checkOutResponse.toResponse();
    }

    // Fetches an employee's attendance for a given date (default: today) from the
    // biometric-device middleware, persists it into our own Attendance table (upsert by
    // userId+date, so refreshing never creates duplicates), and returns the record
    // alongside an overtime/undertime classification against the fixed 8.5h company shift.
    public async syncFromBiometricDevice(
        contextUser: ITokenUser,
        request: IBiometricSyncRequest
    ): Promise<IBiometricSyncResponse> {
        const employee = await this.resolveEmployeeForBiometricSync(contextUser, request.employeeId);
        return this.performBiometricSync(employee, request.date, contextUser);
    }

    // Admin-only: syncs every active employee in the company for one date (default: today).
    public async syncAllEmployeesFromBiometricDevice(
        contextUser: ITokenUser,
        request: IBiometricBulkSyncRequest
    ): Promise<IBiometricBulkSyncResponse> {
        if (!hasAdminAccess(contextUser)) {
            throw new AppError('Forbidden. Admin access required to sync all employees\' attendance.', '403');
        }

        return this.syncEmployeesForCompany(contextUser.companyId, request.date, contextUser);
    }

    // Used by the automatic 30s sync job (schedule-jobs/attendance-sync-cron.ts). Narrowed
    // to employees with a known zkDeviceUserId - i.e. ones a manual sync has already
    // confirmed exist on the device - so the background job doesn't spend a request every
    // tick on employees who will only ever come back NOT_ENROLLED. A brand-new employee's
    // first-ever sync (which populates zkDeviceUserId via reconcileZkDeviceUserId) still
    // needs one manual "Refresh"/"Sync All" click; this job picks them up automatically
    // from then on.
    public async syncAutoEnrolledEmployeesForCompany(
        companyId: string,
        systemContext: ITokenUser
    ): Promise<IBiometricBulkSyncResponse> {
        return this.syncEmployeesForCompany(companyId, undefined, systemContext, {
            zkDeviceUserId: Not(IsNull())
        });
    }

    // Admin-only entry point (syncAllEmployeesFromBiometricDevice) and the automatic sync
    // job (syncAutoEnrolledEmployeesForCompany) both funnel through here. Each employee is
    // attempted independently — one employee's failure (not enrolled on the device, a
    // transient error, whatever) never stops the rest of the batch. Sequential on purpose:
    // the external API is a single ngrok tunnel of unknown capacity, and hammering it
    // concurrently for a whole company risks rate-limiting or timing out every request
    // instead of just the flaky ones.
    private async syncEmployeesForCompany(
        companyId: string,
        date: string | undefined,
        contextUser: ITokenUser,
        employeeWhereExtra: Record<string, any> = {}
    ): Promise<IBiometricBulkSyncResponse> {
        const employees = await this.employeeRepository.where({
            where: { companyId, active: true, ...employeeWhereExtra },
            relations: { user: true, shift: true },
        });

        const todayStr = moment().tz(BUSINESS_TIMEZONE).format('YYYY-MM-DD');
        const resolvedDate = date || todayStr;
        // Only "today" (explicit or defaulted) should get the per-employee overnight
        // check — an explicit historical date is honored literally for everyone, same
        // as the single-employee flow. Passing undefined here (rather than resolvedDate)
        // lets performBiometricSync's own resolveOvernightAwareDate() decide per
        // employee, instead of one date being forced onto the whole batch upfront.
        const isTodayRequest = resolvedDate === todayStr;
        const results: IBiometricBulkSyncEmployeeResult[] = [];

        for (const employee of employees) {
            if (!employee.user) continue;
            const employeeName = sanitizeEmployeeNameForBiometricApi(
                `${employee.user.firstName} ${employee.user.lastName || ''}`
            );

            try {
                const sync = await this.performBiometricSync(
                    employee,
                    isTodayRequest ? undefined : resolvedDate,
                    contextUser
                );
                results.push({
                    employeeId: employee.id,
                    userId: employee.userId,
                    employeeName,
                    outcome: sync.attendanceStatus === 'NOT_ENROLLED'
                        ? 'not_enrolled'
                        : sync.attendanceStatus === 'NO_RECORD'
                            ? 'no_record'
                            : 'synced',
                    message: sync.statusMessage,
                    sync,
                });
            } catch (error) {
                results.push({
                    employeeId: employee.id,
                    userId: employee.userId,
                    employeeName,
                    outcome: 'failed',
                    message: error instanceof AppError ? error.message : 'Unexpected error while syncing this employee.',
                });
            }
        }

        return {
            date: resolvedDate,
            totalEmployees: results.length,
            syncedCount: results.filter(r => r.outcome === 'synced').length,
            noRecordCount: results.filter(r => r.outcome === 'no_record').length,
            notEnrolledCount: results.filter(r => r.outcome === 'not_enrolled').length,
            failedCount: results.filter(r => r.outcome === 'failed').length,
            results,
        };
    }

    // Shared by both the single-employee sync and the bulk sync — everything after the
    // employee has already been resolved (and, for a single sync, permission-checked).
    // No explicit date requested ("today" by default) — but if yesterday still has an
    // open check-in (checked in, never checked out) for this user, that's an overnight
    // shift still in progress from the employee's perspective. The device keys the
    // whole shift under the check-in's calendar date, so querying literal "today" would
    // come back empty. Returns yesterday's date string in that case, otherwise undefined
    // (meaning: let the device default to today, same as before).
    private async resolveOvernightAwareDate(userId: string): Promise<string | undefined> {
        const yesterday = moment().tz(BUSINESS_TIMEZONE).subtract(1, 'day').format('YYYY-MM-DD');

        const openYesterdayRecord = await this.attendanceRepository.firstOrDefault({
            where: {
                userId,
                date: yesterday as any,
                checkInTime: Not(IsNull()),
                checkOutTime: IsNull(),
            },
        });

        return openYesterdayRecord ? yesterday : undefined;
    }

    private async performBiometricSync(
        employee: any,
        date: string | undefined,
        contextUser: ITokenUser
    ): Promise<IBiometricSyncResponse> {
        // Sanitized once here so the exact same clean name is both sent to the external
        // API and shown back to the admin — a stored firstName/lastName with hidden
        // whitespace (e.g. a tab from a spreadsheet copy-paste) shouldn't leak into either.
        const employeeName = sanitizeEmployeeNameForBiometricApi(
            `${employee.user!.firstName} ${employee.user!.lastName || ''}`
        );

        // Overnight shift check: the device keys an overnight shift's whole record
        // (check-in AND check-out) under the check-in's calendar date. If nothing
        // explicit was requested (the caller means "today") and we already have an open
        // check-in from yesterday for this employee, that's the shift still in progress
        // — querying the device for literal "today" would find nothing, since the
        // device has no record under today's date at all yet. Only kicks in for a
        // genuinely open (no check-out) record, so a normal day-shift employee who
        // already checked out yesterday is unaffected.
        const effectiveDate = date ?? await this.resolveOvernightAwareDate(employee.userId);

        let apiResponse;
        try {
            apiResponse = await fetchBiometricAttendance(employeeName, effectiveDate);
        } catch (error) {
            if (error instanceof AppError && error.message === BIOMETRIC_EMPLOYEE_NOT_ENROLLED) {
                return {
                    employeeId: employee.id,
                    employeeName,
                    date: effectiveDate || moment().tz(BUSINESS_TIMEZONE).format('YYYY-MM-DD'),
                    hasRecord: false,
                    stillCheckedIn: false,
                    standardShiftMinutes: STANDARD_SHIFT_MINUTES,
                    attendanceStatus: 'NOT_ENROLLED',
                    statusMessage: "This employee hasn't been enrolled on the biometric device yet.",
                };
            }
            throw error;
        }

        const zkDeviceIdWarning = await this.reconcileZkDeviceUserId(employee, apiResponse.employee_id, contextUser);

        // This is still the DEVICE's calendar date (Pakistan) at this point - it only
        // becomes the business-timezone date once we convert the actual punch times
        // below, since a device-side day can map to a different business-side day.
        const deviceResolvedDate = apiResponse.filter?.date || effectiveDate || moment().tz(DEVICE_TIMEZONE).format('YYYY-MM-DD');
        const record = apiResponse.records.find(r => r.date === deviceResolvedDate) ?? apiResponse.records[0];

        const baseResponse: IBiometricSyncResponse = {
            employeeId: employee.id,
            employeeName,
            date: deviceResolvedDate,
            hasRecord: !!record,
            stillCheckedIn: false,
            standardShiftMinutes: STANDARD_SHIFT_MINUTES,
            attendanceStatus: 'NO_RECORD',
            statusMessage: 'No attendance record found for this date.',
            zkDeviceIdWarning,
        };

        if (!record) {
            return baseResponse;
        }

        const checkIn24Device = parse12HourTimeTo24Hour(record.check_in);
        const checkOut24Device = record.check_out === 'N/A' ? null : parse12HourTimeTo24Hour(record.check_out);

        if (!checkIn24Device) {
            return baseResponse;
        }

        // The device keys the whole record under the check-in's calendar date, so a
        // check-out that's numerically "earlier" than check-in (e.g. 03:00 AM after a
        // 05:30 PM check-in) actually happened the following device-side day.
        const checkOutCrossesMidnightOnDevice =
            checkOut24Device !== null && this.parseTimeToMinutes(checkOut24Device) < this.parseTimeToMinutes(checkIn24Device);
        const checkOutDeviceDate = checkOutCrossesMidnightOnDevice
            ? moment.tz(deviceResolvedDate, 'YYYY-MM-DD', DEVICE_TIMEZONE).add(1, 'day').format('YYYY-MM-DD')
            : deviceResolvedDate;

        // Interpret the raw device times as Pakistan wall-clock, then convert to the
        // business timezone - the physical punch event doesn't change, only how we
        // read and store it. The attendance row's date is the *converted* check-in
        // date going forward (same "check-in's day owns the row" convention as
        // before, just measured in BUSINESS_TIMEZONE instead of the device's).
        const checkInBusiness = convertDeviceTimeToBusiness(deviceResolvedDate, checkIn24Device);
        const checkOutBusiness = checkOut24Device
            ? convertDeviceTimeToBusiness(checkOutDeviceDate, checkOut24Device)
            : null;

        const checkIn24 = checkInBusiness.time;
        const checkOut24 = checkOutBusiness?.time ?? null;
        const resolvedDate = checkInBusiness.date;

        // Persist regardless of clock-in/out completeness — an in-progress check-in is
        // still a real, save-worthy attendance record.
        const { changed, checkInChanged } = await this.upsertBiometricAttendance(
            contextUser,
            employee,
            resolvedDate,
            checkIn24,
            checkOut24
        );

        // Gated on checkInChanged (not the broader `changed`) so a later check-out on
        // the same day's already-recorded check-in doesn't re-fire the alert - it only
        // fires the first time this check-in value is seen. Computed independently of
        // upsertBiometricAttendance's own fields, which never touch lateMinutes/LATE
        // status for biometric records - this alert has zero effect on that data.
        if (checkInChanged && employee.shift?.startTime) {
            const lateMinutes = this.calculateLateness(checkIn24, employee.shift.startTime);
            await this.maybeSendLateArrivalAlert(
                employee,
                lateMinutes,
                checkIn24,
                resolvedDate,
                employee.shift.startTime,
                contextUser
            );
        }

        if (!checkOut24) {
            const nowMinutesToday = moment().tz(BUSINESS_TIMEZONE).format('HH:mm:ss');
            const workedSoFar = diffMinutesAcrossMidnight(checkIn24, nowMinutesToday);
            return {
                ...baseResponse,
                date: resolvedDate,
                checkInTime: checkIn24,
                stillCheckedIn: true,
                workedMinutes: workedSoFar,
                workedHoursLabel: formatMinutesAsHoursAndMinutes(workedSoFar),
                attendanceStatus: 'IN_PROGRESS',
                statusMessage: `Still checked in — ${formatMinutesAsHoursAndMinutes(workedSoFar)} so far.`,
                changed,
            };
        }

        const workedMinutes = diffMinutesAcrossMidnight(checkIn24, checkOut24);
        const diffFromStandard = workedMinutes - STANDARD_SHIFT_MINUTES;

        let attendanceStatus: BiometricAttendanceStatus;
        let statusMessage: string;
        if (Math.abs(diffFromStandard) <= ON_TIME_TOLERANCE_MINUTES) {
            attendanceStatus = 'ON_TIME';
            statusMessage = 'Completed full shift.';
        } else if (diffFromStandard > 0) {
            attendanceStatus = 'OVERTIME';
            statusMessage = `Overtime: ${formatMinutesAsHoursAndMinutes(diffFromStandard)}`;
        } else {
            attendanceStatus = 'UNDERTIME';
            statusMessage = `Short by ${formatMinutesAsHoursAndMinutes(-diffFromStandard)}`;
        }

        return {
            ...baseResponse,
            checkInTime: checkIn24,
            checkOutTime: checkOut24,
            stillCheckedIn: false,
            workedMinutes,
            workedHoursLabel: formatMinutesAsHoursAndMinutes(workedMinutes),
            attendanceStatus,
            statusMessage,
            changed,
        };
    }

    // First successful fetch for an employee auto-populates zkDeviceUserId from the
    // device's employee_id — we currently match by name, so this ID is captured for
    // future reliability/cross-checking, not used as the lookup key yet. On later
    // fetches, a mismatch against the stored ID doesn't block anything (the name match
    // still stands) but is surfaced as a warning, since it likely means two employees
    // share a name and the wrong one's attendance was just fetched.
    private async reconcileZkDeviceUserId(
        employee: { id: string; zkDeviceUserId?: string },
        deviceEmployeeId: string | undefined,
        contextUser: ITokenUser
    ): Promise<string | undefined> {
        if (!deviceEmployeeId) return undefined;

        if (!employee.zkDeviceUserId) {
            await this.employeeRepository.partialUpdate(
                employee.id,
                { zkDeviceUserId: deviceEmployeeId },
                contextUser
            );
            employee.zkDeviceUserId = deviceEmployeeId;
            return undefined;
        }

        if (employee.zkDeviceUserId !== deviceEmployeeId) {
            const warning = `Warning: returned employee ID (${deviceEmployeeId}) doesn't match previously recorded ID (${employee.zkDeviceUserId}) — please verify this is the correct employee.`;
            console.warn(`[biometric-sync] zkDeviceUserId mismatch for employee ${employee.id}: stored=${employee.zkDeviceUserId}, returned=${deviceEmployeeId}`);
            return warning;
        }

        return undefined;
    }

    // employeeId omitted -> resolve the caller's own employee record (employee dashboard);
    // employeeId supplied for someone other than the caller -> only an admin may proceed.
    private async resolveEmployeeForBiometricSync(contextUser: ITokenUser, employeeId?: string) {
        const isSelf = !employeeId || employeeId === contextUser.employeeId;

        if (!isSelf && !hasAdminAccess(contextUser)) {
            throw new AppError('Forbidden. Admin access required to refresh another employee\'s attendance.', '403');
        }

        const employee = employeeId
            ? await this.employeeRepository.firstOrDefault({
                where: { id: employeeId, companyId: contextUser.companyId },
                relations: { user: true, shift: true },
            })
            : await this.employeeRepository.firstOrDefault({
                where: { userId: contextUser.id, companyId: contextUser.companyId },
                relations: { user: true, shift: true },
            });

        if (!employee || !employee.user) {
            throw new AppError('Employee not found.', '404');
        }
        return employee;
    }

    private async upsertBiometricAttendance(
        contextUser: ITokenUser,
        employee: { id: string; userId: string; shiftId?: string },
        date: string,
        checkIn24: string,
        checkOut24: string | null
    ): Promise<{ attendance: Attendance; changed: boolean; checkInChanged: boolean }> {
        const existing = await this.attendanceRepository.firstOrDefault({
            where: { userId: employee.userId, date: date as any },
        });

        // Only meaningful for the automatic sync job: a new row, or a check-in/check-out
        // time that differs from what we already had, is worth pushing to connected
        // clients. Re-persisting identical data every 30s should stay silent.
        const checkInChanged = !existing || existing.checkInTime !== checkIn24;
        const changed = checkInChanged
            || (existing?.checkOutTime ?? null) !== checkOut24;

        const workedMinutes = checkOut24 ? diffMinutesAcrossMidnight(checkIn24, checkOut24) : 0;
        const lockWorkingHours = Math.round((workedMinutes / 60) * 100) / 100;
        const shortfallMinutes = checkOut24 ? Math.max(0, STANDARD_SHIFT_MINUTES - workedMinutes) : 0;

        const fields = {
            checkInTime: checkIn24,
            checkOutTime: checkOut24 ?? undefined,
            status: AttendanceStatus.PRESENT,
            presentStatus: checkOut24 ? PresentStatus.CHECK_OUT : PresentStatus.CHECK_IN,
            shiftId: employee.shiftId,
            totalWorkingHours: STANDARD_SHIFT_MINUTES / 60,
            minimumRequiredWorkingHour: STANDARD_SHIFT_MINUTES / 60,
            lockWorkingHours: checkOut24 ? lockWorkingHours : undefined,
            earlyLeaveMinutes: Math.round(shortfallMinutes),
            notes: 'Synced from biometric device',
        };

        if (existing) {
            const attendance = await this.attendanceRepository.partialUpdate(existing.id, fields, contextUser);
            return { attendance, changed, checkInChanged };
        }

        // toEntity() maps IAttendanceRequest.workingHours -> entity.lockWorkingHours and
        // has no field for earlyLeaveMinutes at all, so both are set directly on the
        // entity afterward rather than through the request DTO.
        const attendanceEntity = new Attendance().toEntity(
            {
                userId: employee.userId,
                shiftId: employee.shiftId,
                date: date as any,
                checkInTime: fields.checkInTime,
                checkOutTime: fields.checkOutTime,
                status: fields.status,
                presentStatus: fields.presentStatus,
                totalWorkingHours: fields.totalWorkingHours,
                minimumRequiredWorkingHour: fields.minimumRequiredWorkingHour,
                notes: fields.notes,
            },
            undefined,
            contextUser
        );
        attendanceEntity.lockWorkingHours = fields.lockWorkingHours;
        attendanceEntity.earlyLeaveMinutes = fields.earlyLeaveMinutes;

        const attendance = await this.attendanceRepository.invokeDbOperations(attendanceEntity, Actions.Add);
        return { attendance, changed, checkInChanged };
    }

    public async get(contextUser?: ITokenUser, fetchRequest?: IFetchRequest<IAttendanceRequest>): Promise<IDataSourceResponse<IAttendanceResponse>> {

        // Modify the base query to include shift relations
        const baseQuery = {
            relations: {
                user: true,
                shift: true,
                breaks: true
            }
        };

        // first check if contextUser is userId exist means only user can access his own attendance records
        if (contextUser && contextUser.role === 'employee') {
            // Create or modify fetchRequest to filter by userId
            const modifiedFetchRequest: IFetchRequest<IAttendanceRequest> = {
                ...fetchRequest,
                queryOptionsRequest: {
                    ...fetchRequest?.queryOptionsRequest,
                    filtersRequest: [
                        // Keep existing filters if any
                        ...(fetchRequest?.queryOptionsRequest?.filtersRequest || []),
                        // Add userId filter
                        {
                            field: 'userId' as keyof IAttendanceRequest,
                            matchMode: FilterMatchModes.Equal,
                            operator: FilterOperators.And,
                            value: contextUser.id
                        },
                        // {
                        //     field: 'date' as keyof IAttendanceRequest,
                        //     matchMode: FilterMatchModes.Between,
                        //     operator: FilterOperators.And,
                        //     rangeValues: {
                        //         start: new Date("2025-06-15").toISOString().split("T")[0], // current date or start date
                        //         end: new Date("2025-06-16").toISOString().split("T")[0] // current date or end date
                        //     }
                        // }
                    ]
                },
            };
            
            return super.get(contextUser, modifiedFetchRequest);
        }

        // If no userId in context, return all records (admin/manager access)
        return super.get(contextUser, fetchRequest);
    }

    public async getStats(contextUser: ITokenUser, fetchRequest: IFetchRequest<IAttendanceRequest>): Promise<IAttendanceStatsResponse> {

        // Stats must aggregate over the WHOLE filtered set, not just one page — otherwise
        // the totals only reflect page 1. Force-fetch all matching rows, and route through
        // this.get (NOT super.get) so an employee's own-records scoping is still applied —
        // otherwise an employee hitting /attendance/stats would get company-wide totals.
        const statsRequest: IFetchRequest<IAttendanceRequest> = {
            ...fetchRequest,
            pagedListRequest: { ...(fetchRequest.pagedListRequest ?? {}), pageNo: 1, getAllRecords: true } as any
        };
        let attendance = await this.get(contextUser, statsRequest);
        const records = attendance.data;

        const totalPresent  = records.filter(a => a.status === AttendanceStatus.PRESENT).length;
        const totalLate     = records.filter(a => a.status === AttendanceStatus.LATE).length;
        const totalAbsent   = records.filter(a => a.status === AttendanceStatus.ABSENT).length;
        const totalOnLeave  = records.filter(a => a.status === AttendanceStatus.ON_LEAVE).length;
        const totalHoliday  = records.filter(a => a.status === AttendanceStatus.HOLIDAY).length;
        const totalDayOff   = records.filter(a => a.status === AttendanceStatus.DAY_OFF).length;
        const totalDefault  = records.filter(a => a.status === AttendanceStatus.DEFAULT).length;
        const totalRecords  = records.length;

        const workingDays = totalRecords - totalHoliday - totalDayOff;
        const attendancePercentage = workingDays > 0
            ? Math.min(100, Math.round(((totalPresent + totalLate) / workingDays) * 100))
            : 0;

        return {
            totalPresent,
            totalLate,
            totalAbsent,
            totalOnLeave,
            totalHoliday,
            totalDayOff,
            totalDefault,
            totalRecords,
            attendancePercentage
        };
    }

    /**
     * Get employee with shift and department information
     */
    private async getEmployeeWithDetails(userId: string, contextUser: ITokenUser) {
        const employee = await this.employeeRepository.firstOrDefault({
            where: {
                userId: userId,
                companyId: contextUser.companyId,
                active: true
            },
            relations: {
                user: true,
                department: true,
                designation: true,
                shift: true
            }
        });

        if (!employee) {
            throw new AppError('Employee not found or inactive', '404');
        }

        return employee;
    }

    /**
     * Check if the given date is a working day for the employee's department
     */
    private async isWorkingDay(date: Date, departmentId: string, contextUser: ITokenUser): Promise<boolean> {
        const dayOfWeek = moment(date).isoWeekday(); // 1=Monday, 7=Sunday
        const dayNames = [
            DayName.MONDAY, DayName.TUESDAY, DayName.WEDNESDAY, DayName.THURSDAY,
            DayName.FRIDAY, DayName.SATURDAY, DayName.SUNDAY
        ];
        const dayName = dayNames[dayOfWeek - 1];

        try {
            // Get working days for the department
            const workingDays = await this.workingDaysService.getEffectiveWorkingDaysForDepartment(departmentId, contextUser);
            const workingDay = workingDays.find((wd: any) => wd.dayName === dayName);
            
            return workingDay?.isWorkingDay ?? false;
        } catch (error) {
            console.warn(`Could not determine working day status for department ${departmentId}:`, error);
            return true; // Default to working day if we can't determine
        }
    }

    /**
     * Determine comprehensive working day status considering:
     * - Regular working days for the department
     * - Public holidays (from attendance record status and publicHolidayId)
     * - Employee leave status
     */
    private async determineWorkingDayStatus(
        date: Date, 
        departmentId: string, 
        hasLeave: boolean, 
        attendanceRecord: any,
        contextUser: ITokenUser
    ): Promise<boolean> {
        
        // If employee has leave, it's not a working day for them
        if (hasLeave) {
            return false;
        }

        // Check if it's a public holiday directly from attendance record
        const isHoliday = attendanceRecord?.status === AttendanceStatus.HOLIDAY && !!attendanceRecord?.publicHolidayId;
        if (isHoliday) {
            return false;
        }

        // Check regular working day schedule for the department
        const isRegularWorkingDay = await this.isWorkingDay(date, departmentId, contextUser);
        
        return isRegularWorkingDay;
    }

    /**
     * Calculate if employee is late based on shift start time
     */
    private calculateLateness(checkInTime: string, shiftStartTime: string): number {
        try {
            const checkInMinutes = this.parseTimeToMinutes(checkInTime);
            const shiftStartMinutes = this.parseTimeToMinutes(shiftStartTime);

            return Math.max(0, checkInMinutes - shiftStartMinutes);
        } catch (error) {
            console.warn('Error calculating lateness:', error);
            return 0;
        }
    }

    // Fires the Late Arrival alert (in-app + best-effort email, to both the employee
    // and the company's admins) once lateMinutes clears LATE_ARRIVAL_ALERT_GRACE_MINUTES.
    // This is purely a notification trigger - it must never write to the Attendance
    // entity or feed into AttendanceStatus/OT-UT classification, which stay driven
    // entirely by ON_TIME_TOLERANCE_MINUTES and actual hours worked. Best-effort:
    // any failure here is swallowed so it can never block a check-in or sync tick.
    private async maybeSendLateArrivalAlert(
        employee: { userId: string; user?: { firstName?: string; lastName?: string; userName?: string; email?: string } },
        lateMinutes: number,
        checkInTime: string,
        date: string,
        shiftStartTime: string,
        contextUser: ITokenUser
    ): Promise<void> {
        if (lateMinutes <= LATE_ARRIVAL_ALERT_GRACE_MINUTES) return;

        try {
            const employeeName = `${employee.user?.firstName ?? ''} ${employee.user?.lastName ?? ''}`.trim()
                || employee.user?.userName
                || 'Employee';
            const lateLabel = formatMinutesAsHoursAndMinutes(lateMinutes);

            // Formatted purely for the email/notification copy — never fed back into
            // any attendance/hours calculation.
            const formattedDate = moment.tz(date, 'YYYY-MM-DD', BUSINESS_TIMEZONE).format('D MMM YYYY');
            const formattedTime = moment.tz(`${date} ${checkInTime}`, 'YYYY-MM-DD HH:mm:ss', BUSINESS_TIMEZONE).format('h:mm A');
            const formattedShiftStart = moment.tz(shiftStartTime, 'HH:mm:ss', BUSINESS_TIMEZONE).format('h:mm A');
            const formattedGraceTime = moment.tz(shiftStartTime, 'HH:mm:ss', BUSINESS_TIMEZONE)
                .add(LATE_ARRIVAL_ALERT_GRACE_MINUTES, 'minutes')
                .format('h:mm A');

            // In-app notifications only here — skipEmail avoids duplicating the
            // dedicated, purpose-built emails sent below with their own template/copy.
            await this.notificationService.createNotification(
                employee.userId,
                {
                    title: 'Late arrival',
                    message: `You checked in ${lateLabel} late today.`,
                    type: NotificationType.LATE_ARRIVAL,
                    skipEmail: true,
                },
                contextUser
            );

            if (employee.user?.email) {
                await sendLateArrivalEmployeeEmail(employee.user.email, {
                    name: employeeName,
                    date: formattedDate,
                    time: formattedTime,
                    shiftStartTime: formattedShiftStart,
                    graceTime: formattedGraceTime,
                });
            }

            const companyUsers = await this.userRepository.where({
                where: { companyId: contextUser.companyId, active: true, deleted: false },
                relations: { role: true },
            });
            const admins = companyUsers.filter((u: any) => u.id !== employee.userId
                && (u.role?.code === DefaultRoles.Admin || u.role?.code === DefaultRoles.SuperAdmin));

            if (admins.length) {
                await this.notificationService.createForUsers(
                    admins.map((u: any) => u.id),
                    {
                        title: 'Late arrival',
                        message: `${employeeName} checked in ${lateLabel} late today.`,
                        type: NotificationType.LATE_ARRIVAL,
                        skipEmail: true,
                    },
                    contextUser
                );

                await Promise.allSettled(
                    admins
                        .filter((u: any) => !!u.email)
                        .map((u: any) => sendLateArrivalAdminEmail(u.email, {
                            employeeName,
                            date: formattedDate,
                            time: formattedTime,
                            shiftStartTime: formattedShiftStart,
                            graceTime: formattedGraceTime,
                        }))
                );
            }
        } catch (error) {
            console.warn('Failed to send late-arrival alert:', error);
        }
    }

    /**
     * Parse time string (HH:MM:SS or HH:MM) to total minutes
     */
    private parseTimeToMinutes(timeString: string): number {
        const parts = timeString.split(':').map(Number);
        const hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        return hours * 60 + minutes;
    }

    /**
     * Validate check-in action
     */
    private async validateCheckIn(userId: string, date: Date, contextUser: ITokenUser): Promise<{employee: any, isValidWorkingDay: boolean}> {
        const employee = await this.getEmployeeWithDetails(userId, contextUser);
        
        if (!employee.departmentId) {
            throw new AppError('Employee department is required for attendance validation', '400');
        }

        // Get or create attendance record for working day determination
        let attendanceRecord = await this.attendanceRepository.firstOrDefault({
            where: {
                userId: userId,
                date: date
            }
        });

        // Check leave directly from attendance record
        const hasLeave = attendanceRecord?.status === AttendanceStatus.ON_LEAVE && !!attendanceRecord?.vacationId;
        const isValidWorkingDay = await this.determineWorkingDayStatus(date, employee.departmentId, hasLeave, attendanceRecord, contextUser);
        
        if (!isValidWorkingDay) {
            console.warn(`User ${userId} is checking in on a non-working day: ${date}`);
            // Allow check-in but log warning - business may allow check-in on non-working days
        }

        return { employee, isValidWorkingDay };
    }

    // /**
    //  * Get attendance with enhanced shift validation details
    //  * This method provides detailed attendance data including shift timing validation
    //  */
    // public async getAttendanceWithShiftDetails(userId: string, date: Date, contextUser: ITokenUser): Promise<IAttendanceResponse & { 
    //     shiftValidation?: {
    //         isLate: boolean;
    //         lateMinutes: number;
    //         isEarlyLeave: boolean;
    //         earlyLeaveMinutes: number;
    //         isWorkingDay: boolean;
    //         shiftStartTime?: string;
    //         shiftEndTime?: string;
    //     }
    // }> {
    //     // Get attendance record with shift details
    //     const attendance = await this.attendanceRepository.firstOrDefault({
    //         where: {
    //             userId: userId,
    //             date: date,
    //             companyId: contextUser.companyId
    //         },
    //         relations: {
    //             user: true,
    //             shift: true,
    //             breaks: true
    //         }
    //     });

    //     if (!attendance) {
    //         throw new AppError('Attendance record not found', '404');
    //     }

    //     // Get employee details for additional validation
    //     const employee = await this.getEmployeeWithDetails(userId, contextUser);
        
    //     // Calculate working day status
    //     const isWorkingDay = await this.isWorkingDay(date, employee.departmentId, contextUser);

    //     // Calculate shift-based validation
    //     let shiftValidation = undefined;
    //     if (attendance.shift && attendance.checkInTime) {
    //         const lateMinutes = this.calculateLateness(attendance.checkInTime, attendance.shift.startTime);
            
    //         let earlyLeaveMinutes = 0;
    //         if (attendance.checkOutTime && attendance.shift.endTime) {
    //             const checkOutMinutes = this.parseTimeToMinutes(attendance.checkOutTime);
    //             const shiftEndMinutes = this.parseTimeToMinutes(attendance.shift.endTime);
                
    //             // Handle overnight shifts
    //             let actualShiftEndMinutes = shiftEndMinutes;
    //             if (shiftEndMinutes < this.parseTimeToMinutes(attendance.shift.startTime)) {
    //                 actualShiftEndMinutes += 24 * 60; // Add 24 hours for next day
    //             }
                
    //             earlyLeaveMinutes = Math.max(0, actualShiftEndMinutes - checkOutMinutes);
    //         }

    //         shiftValidation = {
    //             isLate: lateMinutes > 0,
    //             lateMinutes: lateMinutes,
    //             isEarlyLeave: earlyLeaveMinutes > 0,
    //             earlyLeaveMinutes: earlyLeaveMinutes,
    //             isWorkingDay: isWorkingDay,
    //             shiftStartTime: attendance.shift.startTime,
    //             shiftEndTime: attendance.shift.endTime
    //         };
    //     }

    //     const response = attendance.toResponse();
    //     return {
    //         ...response,
    //         shiftValidation
    //     };
    // }

    /**
     * Bulk update attendance records with shift IDs for existing records
     * This is a utility method to update existing attendance records that may not have shift IDs
     */
    public async updateAttendanceWithShiftIds(contextUser: ITokenUser): Promise<{ updated: number; errors: string[] }> {
        const errors: string[] = [];
        let updated = 0;

        try {
            // Get all attendance records without shift IDs
            const attendanceRecords = await this.attendanceRepository.getCompanyRecords(contextUser.companyId, {
                where: {
                    shiftId: IsNull()
                },
                relations: {
                    user: true
                }
            });

            for (const attendance of attendanceRecords) {
                try {
                    // Get employee details for this attendance record
                    const employee = await this.employeeRepository.firstOrDefault({
                        where: {
                            userId: attendance.userId,
                            companyId: contextUser.companyId,
                            active: true
                        }
                    });

                    if (employee && employee.shiftId) {
                        // Update the attendance record with shift ID
                        await this.attendanceRepository.partialUpdate(
                            attendance.id,
                            { shiftId: employee.shiftId },
                            contextUser
                        );
                        updated++;
                    } else {
                        errors.push(`No active employee or shift found for user ${attendance.userId}`);
                    }
                } catch (error) {
                    errors.push(`Error updating attendance ${attendance.id}: ${error}`);
                }
            }

            return { updated, errors };
        } catch (error) {
            throw new AppError(`Error updating attendance records: ${error}`, '500');
        }
    }

    /**
     * Determine if check-in/check-out actions are allowed
     */
    private determineActionPermissions(
        attendanceRecord: any,
        isWorkingDay: boolean,
        hasLeave: boolean
    ): { canCheckIn: boolean; canCheckOut: boolean } {
        
        // If user has approved leave, they cannot check in/out
        if (hasLeave) {
            return { canCheckIn: false, canCheckOut: false };
        }

        // Check-in logic: allowed only when the user hasn't already checked in
        let canCheckIn = !attendanceRecord?.checkInTime;

        // Check-out logic  
        let canCheckOut = false;
        if (attendanceRecord?.checkInTime && !attendanceRecord?.checkOutTime) {
            // Can check out if checked in but not checked out
            canCheckOut = true;
        }

        // Override for non-working days (business rules may vary)
        if (!isWorkingDay) {
            // Allow but with restrictions - business can decide
            // For now, we'll allow it but frontend can show warnings
        }

        return { canCheckIn, canCheckOut };
    }

    /**
     * Calculates attendance statistics and creates AttendanceSummary record
     * @param attendanceRecords - Array of attendance records for a month.
     * @param workingDaysInfo - Object containing totalWorkingDays, monthDays, and offDays.
     * @param employeeId - Employee ID for the attendance summary
     * @param userId - User ID for the attendance summary
     * @param departmentId - Department ID for the attendance summary
     * @param attendanceMonth - Month for the attendance summary
     * @param attendanceYear - Year for the attendance summary
     * @param contextUser - Context user for database operations
     * @returns Object containing attendance statistics and working hours.
     */
    public async calculateAttendanceStats(
        attendanceRecords: any[], 
        workingDaysInfo: { totalWorkingDays: number; monthDays: number; offDays: number },
        employeeId: string,
        userId: string,
        departmentId: string,
        attendanceMonth: number,
        attendanceYear: number,
        contextUser: any,
        marginMinutes: number = 0
    ): Promise<{
        presentDays: number;
        absentDays: number;
        leaveDays: number;
        holidayDays: number;
        totalWorkingHours: number;
        totalExpectedWorkingHours: number;
        totalLockedWorkingHours: number;
        earlyLeaveDays: number;
        totalEarlyLeaveHours: number;
        lateDays: number;
        totalLateHours: number;
    }> {
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let holidayDays = 0;
        
        // Working hours tracking
        let totalWorkingHours = 0;
        let totalExpectedWorkingHours = 0;
        let totalLockedWorkingHours = 0;
        
        // Early leave tracking
        let earlyLeaveDays = 0;
        let totalEarlyLeaveMinutes = 0; // Keep this for calculation, then convert to hours

        // Late arrival tracking — only lateness BEYOND the shift's grace margin is penalised
        let lateDays = 0;
        let totalLateMinutes = 0;

        // Process existing attendance records
        attendanceRecords.forEach(record => {
            // Calculate working hours for each record
            if (record.totalWorkingHours) {
                totalWorkingHours += Number(record.totalWorkingHours) || 0;
            }
            if (record.minimumRequiredWorkingHour) {
                totalExpectedWorkingHours += Number(record.minimumRequiredWorkingHour) || 0;
            }
            if (record.lockWorkingHours) {
                totalLockedWorkingHours += Number(record.lockWorkingHours) || 0;
            }
            
            // Calculate early leave statistics
            if (record.earlyLeaveMinutes && record.earlyLeaveMinutes > 0) {
                earlyLeaveDays++;
                totalEarlyLeaveMinutes += Number(record.earlyLeaveMinutes) || 0;
            }

            // Calculate the punitive late-arrival penalty, PER DAY, without double-charging.
            //   - grace: derived from the record's OWN snapshot. totalWorkingHours and
            //     minimumRequiredWorkingHour are frozen at creation (= shift hours, and shift
            //     hours minus margin), so their difference is the margin that applied that day.
            //     Using the snapshot — not the live shift — means editing a shift's margin later
            //     can't retroactively change historical late deductions.
            //   - the existing shortfall (earlyLeaveMinutes = required − actually-worked) already
            //     docks lateness that was NOT made up; so we only add the lateness the shortfall
            //     did NOT capture — i.e. when the employee stayed late to finish their hours
            //     (shortfall ~0) yet still arrived late.
            if (record.lateMinutes && record.lateMinutes > 0) {
                lateDays++;
                const hasSnapshot = (Number(record.totalWorkingHours) || 0) > 0;
                const recordMargin = hasSnapshot
                    ? Math.max(0, Math.round(((Number(record.totalWorkingHours) || 0) - (Number(record.minimumRequiredWorkingHour) || 0)) * 60))
                    : (Number(marginMinutes) || 0);
                const lateBeyondMargin = Math.max(0, (Number(record.lateMinutes) || 0) - recordMargin);
                const dayShortfall = Number(record.earlyLeaveMinutes) || 0;
                totalLateMinutes += Math.max(0, lateBeyondMargin - dayShortfall);
            }
            
            switch (record.status) {
                case AttendanceStatus.PRESENT:
                case AttendanceStatus.LATE:
                // case AttendanceStatus.HALF_DAY:
                    presentDays++;
                    break;
                case AttendanceStatus.ABSENT:
                    absentDays++;
                    break;
                case AttendanceStatus.ON_LEAVE:
                    leaveDays++;
                    break;
                case AttendanceStatus.HOLIDAY:
                    holidayDays++;
                    break;
                case AttendanceStatus.DEFAULT:
                    // Default status - check if employee has check-in/check-out time
                    if (record.checkInTime && record.checkOutTime) {
                        presentDays++;
                    } else {
                        absentDays++;
                    }
                    break;
                default:
                    // Unknown status - count as absent
                    absentDays++;
                    break;
            }
        });

        // Remove off days from absent days
        absentDays = absentDays - workingDaysInfo.offDays;

        // Ensure working days equals PRESENT + ABSENT + LEAVE + HOLIDAY
        const currentWorkingDaysTotal = presentDays + absentDays + leaveDays + holidayDays;
        const workingDaysDifference = workingDaysInfo.totalWorkingDays - currentWorkingDaysTotal;
        
        if (workingDaysDifference !== 0) {
            if (workingDaysDifference > 0) {
                // If working days total is LESS than expected, add missing days to ABSENT
                console.log(`Working days total (${currentWorkingDaysTotal}) is LESS than expected (${workingDaysInfo.totalWorkingDays})`);
                console.log(`Adding ${workingDaysDifference} missing working days to ABSENT`);
                absentDays += workingDaysDifference;
            } else {
                // If working days total is MORE than expected, remove excess days from ABSENT
                console.log(`Working days total (${currentWorkingDaysTotal}) is MORE than expected (${workingDaysInfo.totalWorkingDays})`);
                console.log(`Removing ${Math.abs(workingDaysDifference)} excess working days from ABSENT`);
                absentDays += workingDaysDifference; // This will subtract since workingDaysDifference is negative
            }
        }

        // Validation: Ensure total working days equals present + absent + leave + holiday
        const totalCalculatedWorkingDays = presentDays + absentDays + leaveDays + holidayDays;
        const totalCalculatedMonthDays = totalCalculatedWorkingDays + workingDaysInfo.offDays;
        
        console.log(`=== Attendance Calculation Summary ===`);
        console.log(`Working Days: ${workingDaysInfo.totalWorkingDays}, Month Days: ${workingDaysInfo.monthDays}, Off Days: ${workingDaysInfo.offDays}`);
        console.log(`Present: ${presentDays}, Absent: ${absentDays}, Leave: ${leaveDays}, Holiday: ${holidayDays}`);
        console.log(`Total Working Days Calculated: ${totalCalculatedWorkingDays} (should equal ${workingDaysInfo.totalWorkingDays})`);
        console.log(`Total Month Days Calculated: ${totalCalculatedMonthDays} (should equal ${workingDaysInfo.monthDays})`);
        console.log(`Working Hours - Total: ${totalWorkingHours}, Expected: ${totalExpectedWorkingHours}, Actual: ${totalLockedWorkingHours}`);
        console.log(`Early Leave - Days: ${earlyLeaveDays}, Total Minutes: ${totalEarlyLeaveMinutes}, Total Hours: ${Math.round((totalEarlyLeaveMinutes / 60) * 100) / 100}`);
        
        // Verify calculations
        if (totalCalculatedWorkingDays !== workingDaysInfo.totalWorkingDays) {
            console.warn(`⚠️ Warning: Working days mismatch! Expected: ${workingDaysInfo.totalWorkingDays}, Got: ${totalCalculatedWorkingDays}`);
        }
        
        if (totalCalculatedMonthDays !== workingDaysInfo.monthDays) {
            console.warn(`⚠️ Warning: Month days mismatch! Expected: ${workingDaysInfo.monthDays}, Got: ${totalCalculatedMonthDays}`);
        }

        // Create and save attendance summary
        try {
            const attendanceSummaryRequest = {
                employeeId: employeeId,
                userId: userId,
                departmentId: departmentId,
                attendanceMonth: attendanceMonth,
                attendanceYear: attendanceYear,
                status: 'CALCULATED',
                monthDays: workingDaysInfo.monthDays,
                offDays: workingDaysInfo.offDays,
                totalWorkingDays: workingDaysInfo.totalWorkingDays,
                presentDays: presentDays,
                absentDays: absentDays,
                leaveDays: leaveDays,
                publicHolidays: holidayDays,
                earlyLeaveDays: earlyLeaveDays,
                totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
                totalExpectedWorkingHours: Math.round(totalExpectedWorkingHours * 100) / 100,
                totalLockedWorkingHours: Math.round(totalLockedWorkingHours * 100) / 100,
                totalEarlyLeaveHours: Math.round((totalEarlyLeaveMinutes / 60) * 100) / 100,
                notes: `=== Attendance Calculation Summary ===\nWorking Days: ${workingDaysInfo.totalWorkingDays}, Month Days: ${workingDaysInfo.monthDays}, Off Days: ${workingDaysInfo.offDays}\nPresent: ${presentDays}, Absent: ${absentDays}, Leave: ${leaveDays}, Holiday: ${holidayDays}\nTotal Working Days Calculated: ${totalCalculatedWorkingDays} (should equal ${workingDaysInfo.totalWorkingDays})\nTotal Month Days Calculated: ${totalCalculatedMonthDays} (should equal ${workingDaysInfo.monthDays})\nWorking Hours - Total: ${Math.round(totalWorkingHours * 100) / 100}, Expected: ${Math.round(totalExpectedWorkingHours * 100) / 100}, Actual: ${Math.round(totalLockedWorkingHours * 100) / 100}\nEarly Leave - Days: ${earlyLeaveDays}, Total Hours: ${Math.round((totalEarlyLeaveMinutes / 60) * 100) / 100}`
            };

            const attendanceSummary = new AttendanceSummary().toEntity(
                attendanceSummaryRequest,
                undefined,
                contextUser
            );
            await this.attendanceSummaryRepository.invokeDbOperationsWithResponse(attendanceSummary, Actions.Add);
            
            console.log(`Created attendance summary for employee ${employeeId} for ${attendanceMonth}/${attendanceYear}`);
        } catch (error) {
            console.error(`Error creating attendance summary for employee ${employeeId}:`, error);
            // Don't throw error, just log it - attendance calculation should still work
        }

        return { 
            presentDays, 
            absentDays, 
            leaveDays, 
            holidayDays,
            totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
            totalExpectedWorkingHours: Math.round(totalExpectedWorkingHours * 100) / 100,
            totalLockedWorkingHours: Math.round(totalLockedWorkingHours * 100) / 100,
            earlyLeaveDays,
            totalEarlyLeaveHours: Math.round((totalEarlyLeaveMinutes / 60) * 100) / 100, // Convert minutes to hours
            lateDays,
            totalLateHours: Math.round((totalLateMinutes / 60) * 100) / 100 // Effective late hours, post-margin
        };
    }
}