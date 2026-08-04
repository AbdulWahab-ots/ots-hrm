import { CronJob } from 'cron';
import { Server as SocketIOServer } from 'socket.io';
import { CompanyRepository } from '../dal';
import { AttendanceService } from '../bl/attendance-service';
import { ITokenUser } from '../models';
import { EmptyGuid } from '../constants';
import { emitAttendanceUpdate } from '../socket/socket-io';

const TIMEZONE = 'Asia/Karachi';
// Every 30 seconds - leadership wants attendance to look "live" on both the Admin
// and Employee sides without anyone clicking Refresh/Sync All. The biometric
// middleware is pull-only, so this is the polling half of that; Socket.IO
// (emitAttendanceUpdate) is the push half.
const SYNC_SCHEDULE = '*/30 * * * * *';

// Same system actor convention as AttendanceCronJob (attendance-cron.ts) - audit
// columns need a real UUID, and EmptyGuid signals "no human user" since there's no
// FK on createdById/modifiedById.
const SYSTEM_USER_ID = EmptyGuid;

export class AttendanceSyncCronJob {
    private syncJob: CronJob;

    constructor(
        private readonly attendanceService: AttendanceService,
        private readonly companyRepository: CompanyRepository,
        private readonly io: SocketIOServer
    ) {
        this.syncJob = new CronJob(SYNC_SCHEDULE, () => this.run(), null, false, TIMEZONE);
    }

    start(): void {
        this.syncJob.start();
        console.log('✅ Automatic biometric sync job started — runs every 30 seconds');
    }

    stop(): void {
        this.syncJob.stop();
        console.log('🛑 Automatic biometric sync job stopped');
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

            let totalChanged = 0;
            for (const company of companies) {
                totalChanged += await this.syncCompany(company.id);
            }

            if (totalChanged > 0) {
                console.log(`✅ Automatic sync: ${totalChanged} employee(s) had a new/changed attendance record`);
            }
        } catch (error) {
            // One bad tick must never stop future ticks - the CronJob keeps its own
            // schedule regardless, but log it the same way the other cron does.
            console.error('❌ Automatic biometric sync job failed:', error);
        }
    }

    private async syncCompany(companyId: string): Promise<number> {
        const result = await this.attendanceService.syncAutoEnrolledEmployeesForCompany(
            companyId,
            this.systemContext(companyId)
        );

        let changed = 0;
        for (const employeeResult of result.results) {
            if (employeeResult.outcome !== 'synced' || !employeeResult.sync?.changed) continue;

            emitAttendanceUpdate(this.io, companyId, employeeResult.userId, {
                ...employeeResult.sync,
                userId: employeeResult.userId
            });
            changed++;
        }

        return changed;
    }
}
