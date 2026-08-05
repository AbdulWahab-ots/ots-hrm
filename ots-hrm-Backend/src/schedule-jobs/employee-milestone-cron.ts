import { CronJob } from 'cron';
import moment from 'moment-timezone';
import { CompanyRepository } from '../dal';
import { EmployeeMilestoneService } from '../bl/employee-milestone-service';
import { ITokenUser } from '../models';
import { EmptyGuid } from '../constants';
import { BUSINESS_TIMEZONE } from '../utility/timezone-utility';

const TIMEZONE = BUSINESS_TIMEZONE;
const DAILY_SCHEDULE = '0 6 * * *'; // 6:00 AM business time — after the day's records exist, well before most people check email

// Same system actor convention as AttendanceCronJob/AttendanceSyncCronJob - audit
// columns need a real UUID, and EmptyGuid signals "no human user" since there's no
// FK on createdById/modifiedById.
const SYSTEM_USER_ID = EmptyGuid;

// Daily check for employee birthdays and work anniversaries, across every active
// company. Thin orchestrator - all detection/notification logic lives in
// EmployeeMilestoneService so the exact same code path is reachable from the manual
// per-company test-trigger endpoint (EmployeeController.triggerMilestoneCheck).
export class EmployeeMilestoneCronJob {
    private dailyJob: CronJob;

    constructor(
        private readonly employeeMilestoneService: EmployeeMilestoneService,
        private readonly companyRepository: CompanyRepository
    ) {
        this.dailyJob = new CronJob(DAILY_SCHEDULE, () => this.run(), null, false, TIMEZONE);
    }

    start(): void {
        this.dailyJob.start();
        const zoneLabel = moment().tz(TIMEZONE).zoneAbbr();
        console.log(`✅ Birthday/Work Anniversary job started — runs at 6:00 AM ${zoneLabel}`);
    }

    stop(): void {
        this.dailyJob.stop();
        console.log('🛑 Birthday/Work Anniversary cron job stopped');
    }

    // Exposed so it can be triggered manually (e.g. for testing or backfill).
    async runNow(): Promise<void> {
        await this.run();
    }

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

    private async run(): Promise<void> {
        try {
            const companies = await this.companyRepository.where({
                where: { active: true, deleted: false }
            });

            let totalBirthdays = 0;
            let totalAnniversaries = 0;

            for (const company of companies) {
                const { birthdays, anniversaries } = await this.employeeMilestoneService.checkAndNotifyForCompany(
                    company.id,
                    this.systemContext(company.id)
                );
                totalBirthdays += birthdays;
                totalAnniversaries += anniversaries;
            }

            console.log(`✅ Birthday/Work Anniversary job completed — birthdays: ${totalBirthdays}, anniversaries: ${totalAnniversaries}`);
        } catch (error) {
            // One bad tick must never stop future ticks.
            console.error('❌ Birthday/Work Anniversary job failed:', error);
        }
    }
}
