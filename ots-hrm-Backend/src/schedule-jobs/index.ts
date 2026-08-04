import { DependencyContainer } from 'tsyringe';
import { Server as SocketIOServer } from 'socket.io';
import { AttendanceCronJob } from './attendance-cron';
import { AttendanceSyncCronJob } from './attendance-sync-cron';
import { AttendanceRepository, EmployeeRepository, VacationRepository, PublicHolidayRepository, CompanyRepository } from '../dal';
import { WorkingDaysService } from '../bl/working-days-service';
import { AttendanceService } from '../bl/attendance-service';

export { AttendanceCronJob, AttendanceSyncCronJob };

export interface ScheduledJobs {
    attendanceCron: AttendanceCronJob | null;
    attendanceSyncCron: AttendanceSyncCronJob | null;
}

export const initScheduleJobs = (container: DependencyContainer, io: SocketIOServer): ScheduledJobs => {
    // Cron runs in-process. If you scale to multiple instances, only ONE should run these
    // jobs or every instance duplicates the work — set ATTENDANCE_CRON_ENABLED=false on the rest.
    // ponytail: env flag is the simple guard; swap for a DB/Redis leader-lock if you ever need HA scheduling.
    if (process.env.ATTENDANCE_CRON_ENABLED === 'false') {
        console.log('⏸️  Attendance cron disabled on this instance (ATTENDANCE_CRON_ENABLED=false)');
        return { attendanceCron: null, attendanceSyncCron: null };
    }

    const attendanceCron = new AttendanceCronJob(
        container.resolve<AttendanceRepository>('AttendanceRepository'),
        container.resolve<EmployeeRepository>('EmployeeRepository'),
        container.resolve<VacationRepository>('VacationRepository'),
        container.resolve<PublicHolidayRepository>('PublicHolidayRepository'),
        container.resolve<CompanyRepository>('CompanyRepository'),
        container.resolve<WorkingDaysService>('WorkingDaysService')
    );
    attendanceCron.start();

    // Independent kill switch from the absence-marking job above, in case leadership
    // wants to disable just the automatic biometric polling (e.g. the device/tunnel
    // is down) without also turning off daily-record-creation and absent-marking.
    let attendanceSyncCron: AttendanceSyncCronJob | null = null;
    if (process.env.ATTENDANCE_AUTO_SYNC_ENABLED === 'false') {
        console.log('⏸️  Automatic biometric sync disabled (ATTENDANCE_AUTO_SYNC_ENABLED=false)');
    } else {
        attendanceSyncCron = new AttendanceSyncCronJob(
            container.resolve<AttendanceService>('AttendanceService'),
            container.resolve<CompanyRepository>('CompanyRepository'),
            io
        );
        attendanceSyncCron.start();
    }

    return { attendanceCron, attendanceSyncCron };
};
