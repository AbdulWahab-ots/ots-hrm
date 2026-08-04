import { CronJob } from 'cron';
import moment from 'moment-timezone';
import { In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AttendanceRepository, EmployeeRepository, VacationRepository, PublicHolidayRepository, CompanyRepository } from '../dal';
import { WorkingDaysService } from '../bl/working-days-service';
import { Attendance } from '../entities';
import {
    Actions,
    AttendanceStatus,
    DayName,
    EmployeeStatus,
    IAttendanceRequest,
    ITokenUser,
    RequestType,
    VacationStatus
} from '../models';
import { EmptyGuid } from '../constants';
import { BUSINESS_TIMEZONE } from '../utility/timezone-utility';

const TIMEZONE = BUSINESS_TIMEZONE;
const DAILY_SCHEDULE         = '0 1 * * *';   // 1:00 AM — create default records
const ABSENT_MARKING_SCHEDULE = '*/15 * * * *'; // every 15 min — mark absent once the shift has ended

// Audit columns createdById/modifiedById are non-null `uuid`s. Passing the string
// 'system' makes Postgres reject every cron insert/update ("invalid input syntax for
// type uuid"), so the system actor must be a real UUID. EmptyGuid (nil UUID) = "no
// human user"; there is no FK on these columns so this is safe to store.
const SYSTEM_USER_ID = EmptyGuid;

// Standard end-of-workday for employees with NO shift assigned. Per business decision
// they're treated as a normal working day, so they're only marked absent after this
// time passes with no check-in.
// ponytail: hard-coded default; promote to a company setting if shiftless staff are common.
const NO_SHIFT_WORKDAY_END = '18:00:00';

export class AttendanceCronJob {
    private dailyJob: CronJob;
    private absentMarkingJob: CronJob;

    constructor(
        private readonly attendanceRepository: AttendanceRepository,
        private readonly employeeRepository: EmployeeRepository,
        private readonly vacationRepository: VacationRepository,
        private readonly publicHolidayRepository: PublicHolidayRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly workingDaysService: WorkingDaysService
    ) {
        this.dailyJob         = new CronJob(DAILY_SCHEDULE,         () => this.run(),                     null, false, TIMEZONE);
        this.absentMarkingJob = new CronJob(ABSENT_MARKING_SCHEDULE, () => this.markAbsentAfterShiftEnd(), null, false, TIMEZONE);
    }

    start(): void {
        this.dailyJob.start();
        this.absentMarkingJob.start();
        // zoneAbbr() reports EST or EDT correctly depending on the actual date (DST-aware),
        // rather than hardcoding one that goes stale for half the year.
        const zoneLabel = moment().tz(TIMEZONE).zoneAbbr();
        console.log(`✅ Daily attendance job started — runs at 1:00 AM ${zoneLabel}`);
        console.log(`✅ Absent marking job started — runs every 15 minutes ${zoneLabel}`);
    }

    stop(): void {
        this.dailyJob.stop();
        this.absentMarkingJob.stop();
        console.log('🛑 Attendance cron jobs stopped');
    }

    // Exposed so it can be triggered manually (e.g. for testing or backfill)
    async runNow(): Promise<void> {
        await this.run();
    }

    async markAbsentNow(): Promise<void> {
        await this.markAbsentAfterShiftEnd();
    }

    // System actor for cron-initiated DB writes (createdById/modifiedById need a real UUID).
    private systemContext(companyId: string): ITokenUser {
        return {
            id: SYSTEM_USER_ID,
            name: 'System',
            companyId,
            roleId: 'system',
            role: 'system',
            privileges: []
        };
    }

    // Parse 'HH:mm' or 'HH:mm:ss' to minutes since midnight. A plain string compare
    // breaks across formats ('9:00' vs '09:00:00'), so normalise to a number.
    private timeToMinutes(t: string): number {
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    }

    private async run(): Promise<void> {
        const today = new Date(moment().tz(TIMEZONE).format('YYYY-MM-DD'));
        const todayStr = moment().tz(TIMEZONE).format('YYYY-MM-DD');
        console.log(`🕐 Attendance cron job running for date: ${todayStr}`);

        try {
            const companies = await this.companyRepository.where({
                where: { active: true, deleted: false }
            });

            let totalCreated = 0;
            let totalSkipped = 0;

            for (const company of companies) {
                const { created, skipped } = await this.createDailyRecordsForCompany(
                    company.id,
                    today,
                    todayStr
                );
                totalCreated += created;
                totalSkipped += skipped;
            }

            console.log(`✅ Attendance cron job completed — created: ${totalCreated}, skipped (already existed): ${totalSkipped}`);
        } catch (error) {
            console.error('❌ Attendance cron job failed:', error);
        }
    }

    private async createDailyRecordsForCompany(
        companyId: string,
        today: Date,
        todayStr: string
    ): Promise<{ created: number; skipped: number }> {
        const systemContext = this.systemContext(companyId);

        // Get all active employees with shift info
        const employees = await this.employeeRepository.getCompanyRecords(companyId, {
            where: {
                active: true,
                status: In([EmployeeStatus.PERMANENT, EmployeeStatus.CONTRACT, EmployeeStatus.PROBATION])
            },
            relations: { shift: true }
        });

        if (employees.length === 0) return { created: 0, skipped: 0 };

        const employeeUserIds = employees.map(e => e.userId);

        // Existing records for today — skip these employees
        const existingRecords = await this.attendanceRepository.getCompanyRecords(companyId, {
            where: { userId: In(employeeUserIds), date: today }
        });
        const existingSet = new Set(existingRecords.map(r => r.userId));

        // Public holidays for today grouped by departmentId
        const allHolidays = await this.publicHolidayRepository.getCompanyRecords(companyId, {
            where: { active: true, deleted: false }
        });
        const holidayByDept = new Map<string, typeof allHolidays[0]>();
        for (const holiday of allHolidays) {
            if (holiday.dates.includes(todayStr)) {
                holidayByDept.set(holiday.departmentId, holiday);
            }
        }

        // Approved leaves covering today for all employees
        const approvedLeaves = await this.vacationRepository.where({
            where: {
                companyId,
                requestedBy: In(employeeUserIds),
                status: VacationStatus.APPROVED,
                requestType: RequestType.LEAVE,
                fromDate: LessThanOrEqual(today) as any,
                toDate: MoreThanOrEqual(today) as any,
                active: true
            }
        });
        const leaveByUser = new Map<string, typeof approvedLeaves[0]>();
        for (const leave of approvedLeaves) {
            leaveByUser.set(leave.requestedBy, leave);
        }

        // Build attendance entities for employees missing today's record
        const toCreate: Attendance[] = [];

        for (const employee of employees) {
            if (existingSet.has(employee.userId)) continue;

            const request = await this.buildAttendanceRequest(
                employee,
                today,
                todayStr,
                holidayByDept,
                leaveByUser,
                systemContext
            );

            const entity = new Attendance().toEntity(request, undefined, systemContext);
            toCreate.push(entity);
        }

        if (toCreate.length === 0) {
            return { created: 0, skipped: existingRecords.length };
        }

        try {
            await this.attendanceRepository.invokeDbOperationsRange(toCreate, Actions.Add);
        } catch (error: any) {
            // Another process may have inserted concurrently — safe to ignore
            if (!error?.message?.includes('duplicate key')) throw error;
        }

        return { created: toCreate.length, skipped: existingRecords.length };
    }

    private async buildAttendanceRequest(
        employee: any,
        today: Date,
        todayStr: string,
        holidayByDept: Map<string, any>,
        leaveByUser: Map<string, any>,
        systemContext: ITokenUser
    ): Promise<IAttendanceRequest> {
        const base: IAttendanceRequest = {
            userId: employee.userId,
            shiftId: employee.shiftId,
            date: today,
            status: AttendanceStatus.DEFAULT,
            totalWorkingHours: 0,
            minimumRequiredWorkingHour: 0
        };

        // Priority 1: Public Holiday
        const holiday = holidayByDept.get(employee.departmentId);
        if (holiday) {
            return {
                ...base,
                status: AttendanceStatus.HOLIDAY,
                publicHolidayId: holiday.id,
                totalWorkingHours: 0,
                minimumRequiredWorkingHour: 0
            };
        }

        // Priority 2: Approved Leave
        const leave = leaveByUser.get(employee.userId);
        if (leave) {
            return {
                ...base,
                status: AttendanceStatus.ON_LEAVE,
                vacationId: leave.id,
                totalWorkingHours: 0,
                minimumRequiredWorkingHour: 0
            };
        }

        // Priority 3: Day Off (not a working day per department schedule)
        const isWorkingDay = await this.isWorkingDay(today, employee.departmentId, systemContext);
        if (!isWorkingDay) {
            return {
                ...base,
                status: AttendanceStatus.DAY_OFF,
                totalWorkingHours: 0,
                minimumRequiredWorkingHour: 0
            };
        }

        // Priority 4: Regular working day — DEFAULT with shift-based hours
        if (employee.shift) {
            base.totalWorkingHours = Math.round((employee.shift.workingHours / 60) * 100) / 100;
            base.minimumRequiredWorkingHour = Math.round(
                ((employee.shift.workingHours - employee.shift.marginTime) / 60) * 100
            ) / 100;
        }

        return base;
    }

    private async isWorkingDay(date: Date, departmentId: string, contextUser: ITokenUser): Promise<boolean> {
        const dayOfWeek = moment(date).isoWeekday();
        const dayNames = [
            DayName.MONDAY, DayName.TUESDAY, DayName.WEDNESDAY, DayName.THURSDAY,
            DayName.FRIDAY, DayName.SATURDAY, DayName.SUNDAY
        ];
        const dayName = dayNames[dayOfWeek - 1];

        try {
            const workingDays = await this.workingDaysService.getEffectiveWorkingDaysForDepartment(
                departmentId,
                contextUser
            );
            const workingDay = workingDays.find((wd: any) => wd.dayName === dayName);
            return workingDay?.isWorkingDay ?? false;
        } catch (error) {
            // Fail safe: if the schedule can't be determined, treat it as a non-working
            // day so no one is wrongly marked absent (which would dock pay). Logged, not silent.
            console.error(`⚠️ isWorkingDay lookup failed for department ${departmentId}; treating as day off:`, error);
            return false;
        }
    }

    // Runs every 15 minutes — marks DEFAULT records ABSENT once the working day has ended with no check-in
    private async markAbsentAfterShiftEnd(): Promise<void> {
        const todayStr = moment().tz(TIMEZONE).format('YYYY-MM-DD');

        try {
            const companies = await this.companyRepository.where({
                where: { active: true, deleted: false }
            });

            let totalMarked = 0;
            for (const company of companies) {
                totalMarked += await this.markAbsentForCompany(company.id, todayStr);
            }

            if (totalMarked > 0) {
                console.log(`✅ Absent marking: ${totalMarked} employees marked ABSENT (shift ended, no check-in)`);
            }
        } catch (error) {
            console.error('❌ Absent marking job failed:', error);
        }
    }

    private async markAbsentForCompany(companyId: string, todayStr: string): Promise<number> {
        const systemContext = this.systemContext(companyId);
        const now = moment().tz(TIMEZONE);

        // Process each business day by its KNOWN business-timezone date string. We deliberately do NOT
        // read the hydrated record.date for the cutoff: rows are stored via new Date('YYYY-MM-DD')
        // and can round-trip a calendar day off in a non-UTC process/DB timezone, which would
        // otherwise mark a freshly-created row absent immediately. Yesterday is included because
        // an overnight shift's row is dated the day it STARTS but only ends the next morning.
        const yesterdayStr = moment.tz(todayStr, 'YYYY-MM-DD', TIMEZONE).subtract(1, 'day').format('YYYY-MM-DD');

        let marked = 0;
        for (const dateStr of [yesterdayStr, todayStr]) {
            const records = await this.attendanceRepository.getCompanyRecords(companyId, {
                where: {
                    date: new Date(dateStr),
                    status: AttendanceStatus.DEFAULT,
                    active: true
                },
                relations: { shift: true }
            });

            // ponytail: one UPDATE per record (partialUpdate also re-selects). Fine at HR scale;
            // switch to a single bulk UPDATE ... WHERE if a tenant ever has thousands of staff.
            for (const record of records) {
                // Skip if the employee has already checked in.
                if (record.checkInTime) continue;

                // Mark absent only once the working day is OVER with no check-in. The end datetime
                // is built from the KNOWN business date (dateStr), never record.date:
                //   same-day shift / no shift → ends that date at endTime (or 18:00 default)
                //   start >= end (overnight 22:00–06:00, or 24h 00:00–00:00) → ends the NEXT day,
                //     so today's row is skipped this morning while yesterday's overnight row is caught.
                const endTime = record.shift?.endTime || NO_SHIFT_WORKDAY_END;
                const endMinutes = this.timeToMinutes(endTime);
                const isOvernight = !!record.shift?.startTime
                    && this.timeToMinutes(record.shift.startTime) >= endMinutes;
                const endMoment = moment.tz(dateStr, 'YYYY-MM-DD', TIMEZONE)
                    .add(endMinutes + (isOvernight ? 1440 : 0), 'minutes');

                if (now.isBefore(endMoment)) continue;

                await this.attendanceRepository.partialUpdate(
                    record.id,
                    { status: AttendanceStatus.ABSENT } as any,
                    systemContext
                );
                marked++;
            }
        }

        return marked;
    }
}
