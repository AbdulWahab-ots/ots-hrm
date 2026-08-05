import { inject, injectable } from "tsyringe";
import { In } from "typeorm";
import { EmployeeRepository, UserRepository } from "../dal";
import { NotificationService } from "./notification-service";
import { ITokenUser, NotificationType, EmployeeStatus } from "../models";
import { DefaultRoles } from "../constants/roles";
import { formatOrdinal } from "../utility/string-utility";
import {
    sendBirthdayEmployeeEmail,
    sendBirthdayAdminEmail,
    sendAnniversaryEmployeeEmail,
    sendAnniversaryAdminEmail,
} from "../utility/mail-utility";

// Detects employees whose birthday or work anniversary falls on a given date (default:
// today) and fires the in-app notification + dedicated email to both the employee and
// their company's admins. Single source of truth for both the daily cron (all
// companies) and the manual test-trigger endpoint (one company) - see
// EmployeeMilestoneCronJob and EmployeeController.triggerMilestoneCheck.
@injectable()
export class EmployeeMilestoneService {
    constructor(
        @inject('EmployeeRepository') private readonly employeeRepository: EmployeeRepository,
        @inject('UserRepository') private readonly userRepository: UserRepository,
        @inject('NotificationService') private readonly notificationService: NotificationService
    ) { }

    // Scoped to one company (multi-tenant: only that company's admins/employee see
    // anything). Safe to call repeatedly/re-trigger - each employee/event-type only
    // fires once per calendar year, tracked via lastBirthdayNotifiedYear /
    // lastAnniversaryNotifiedYear on the Employee row.
    public async checkAndNotifyForCompany(
        companyId: string,
        contextUser: ITokenUser,
        asOf: Date = new Date()
    ): Promise<{ birthdays: number; anniversaries: number }> {
        const employees = await this.employeeRepository.getCompanyRecords(companyId, {
            where: {
                active: true,
                status: In([EmployeeStatus.PERMANENT, EmployeeStatus.CONTRACT, EmployeeStatus.PROBATION]),
            },
            relations: { user: true },
        });

        const currentYear = asOf.getFullYear();
        let birthdays = 0;
        let anniversaries = 0;

        for (const employee of employees) {
            if (!employee.user) continue;

            if (employee.isBirthdayToday(asOf) && employee.lastBirthdayNotifiedYear !== currentYear) {
                await this.sendBirthdayAlert(employee, contextUser);
                await this.employeeRepository.partialUpdate(
                    employee.id,
                    { lastBirthdayNotifiedYear: currentYear },
                    contextUser
                );
                birthdays++;
            }

            if (employee.isAnniversaryToday(asOf) && employee.lastAnniversaryNotifiedYear !== currentYear) {
                const years = employee.getYearsOfService(asOf);
                await this.sendAnniversaryAlert(employee, years, contextUser);
                await this.employeeRepository.partialUpdate(
                    employee.id,
                    { lastAnniversaryNotifiedYear: currentYear },
                    contextUser
                );
                anniversaries++;
            }
        }

        return { birthdays, anniversaries };
    }

    // Same "find all company admins" pattern as AttendanceService.maybeSendLateArrivalAlert.
    private async getCompanyAdmins(companyId: string, excludeUserId: string) {
        const companyUsers = await this.userRepository.where({
            where: { companyId, active: true, deleted: false },
            relations: { role: true },
        });
        return companyUsers.filter((u: any) => u.id !== excludeUserId
            && (u.role?.code === DefaultRoles.Admin || u.role?.code === DefaultRoles.SuperAdmin));
    }

    private employeeDisplayName(employee: any): string {
        return `${employee.user?.firstName ?? ''} ${employee.user?.lastName ?? ''}`.trim()
            || employee.user?.userName
            || 'Employee';
    }

    // Best-effort, same as maybeSendLateArrivalAlert - never let a notification
    // failure block the cron tick or the rest of the company's employee list.
    private async sendBirthdayAlert(employee: any, contextUser: ITokenUser): Promise<void> {
        try {
            const employeeName = this.employeeDisplayName(employee);

            await this.notificationService.createNotification(
                employee.userId,
                {
                    title: 'Happy Birthday!',
                    message: `Happy Birthday, ${employeeName}! 🎉`,
                    type: NotificationType.BIRTHDAY,
                    skipEmail: true,
                },
                contextUser
            );
            if (employee.user?.email) {
                await sendBirthdayEmployeeEmail(employee.user.email, { name: employeeName });
            }

            const admins = await this.getCompanyAdmins(contextUser.companyId, employee.userId);
            if (admins.length) {
                await this.notificationService.createForUsers(
                    admins.map((u: any) => u.id),
                    {
                        title: 'Employee birthday today',
                        message: `Today is ${employeeName}'s birthday.`,
                        type: NotificationType.BIRTHDAY,
                        skipEmail: true,
                    },
                    contextUser
                );
                await Promise.allSettled(
                    admins.filter((u: any) => !!u.email)
                        .map((u: any) => sendBirthdayAdminEmail(u.email, { employeeName }))
                );
            }
        } catch (error) {
            console.warn('Failed to send birthday alert:', error);
        }
    }

    private async sendAnniversaryAlert(employee: any, years: number, contextUser: ITokenUser): Promise<void> {
        try {
            const employeeName = this.employeeDisplayName(employee);
            const ordinal = formatOrdinal(years);

            await this.notificationService.createNotification(
                employee.userId,
                {
                    title: 'Happy Work Anniversary!',
                    message: `Congratulations on your ${ordinal} work anniversary, ${employeeName}! 🎉`,
                    type: NotificationType.WORK_ANNIVERSARY,
                    skipEmail: true,
                },
                contextUser
            );
            if (employee.user?.email) {
                await sendAnniversaryEmployeeEmail(employee.user.email, { name: employeeName, ordinal });
            }

            const admins = await this.getCompanyAdmins(contextUser.companyId, employee.userId);
            if (admins.length) {
                await this.notificationService.createForUsers(
                    admins.map((u: any) => u.id),
                    {
                        title: 'Employee work anniversary today',
                        message: `Today marks ${employeeName}'s ${ordinal} work anniversary.`,
                        type: NotificationType.WORK_ANNIVERSARY,
                        skipEmail: true,
                    },
                    contextUser
                );
                await Promise.allSettled(
                    admins.filter((u: any) => !!u.email)
                        .map((u: any) => sendAnniversaryAdminEmail(u.email, { employeeName, ordinal }))
                );
            }
        } catch (error) {
            console.warn('Failed to send anniversary alert:', error);
        }
    }
}
