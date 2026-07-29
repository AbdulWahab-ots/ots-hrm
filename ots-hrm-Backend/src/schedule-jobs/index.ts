import { DependencyContainer } from 'tsyringe';
import { AttendanceCronJob } from './attendance-cron';
import { AttendanceRepository, EmployeeRepository, VacationRepository, PublicHolidayRepository, CompanyRepository } from '../dal';
import { WorkingDaysService } from '../bl/working-days-service';

export { AttendanceCronJob };

export const initScheduleJobs = (container: DependencyContainer): AttendanceCronJob | null => {
    // Cron runs in-process. If you scale to multiple instances, only ONE should run these
    // jobs or every instance duplicates the work — set ATTENDANCE_CRON_ENABLED=false on the rest.
    // ponytail: env flag is the simple guard; swap for a DB/Redis leader-lock if you ever need HA scheduling.
    if (process.env.ATTENDANCE_CRON_ENABLED === 'false') {
        console.log('⏸️  Attendance cron disabled on this instance (ATTENDANCE_CRON_ENABLED=false)');
        return null;
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
    return attendanceCron;
};
