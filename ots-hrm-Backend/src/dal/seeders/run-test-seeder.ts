import "reflect-metadata";
import { DataSource } from "typeorm";
import { getTypeOrmConfig } from "../../config/db-env.config";
import pg from "pg";
import {
  Company, MasterEnum, Country, Privilege, Role, PublicHoliday, User, ToDo,
  ActivityLog, AuditLog, Verification, Department, Designation, LeaveType,
  Employee, Attendance, AttendanceBreak, Vacation, WorkingDays, Shift,
  UserShift, Scheduler, Invite, Request, Benefit, EmployeeBenefit, Payroll,
  PayrollAdjustment, AttendanceSummary, Announcement, Notification,
} from "../../entities";
import { seedTestData } from "./test-data-seeder";

const runSeeder = async () => {
  const dbConfig = getTypeOrmConfig();

  const dataSource = new DataSource({
    driver: pg,
    ...dbConfig,
    entities: [
      Company, Country, MasterEnum, User, Role, Privilege, ToDo, ActivityLog,
      AuditLog, Verification, Department, Designation, LeaveType, PublicHoliday,
      Employee, Attendance, AttendanceBreak, Vacation, WorkingDays, Shift,
      UserShift, Scheduler, Invite, Request, Benefit, EmployeeBenefit, Payroll,
      PayrollAdjustment, AttendanceSummary, Announcement, Notification,
    ],
    migrations: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connected");

    await seedTestData(dataSource);

    await dataSource.destroy();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeder failed:", err);
    if (dataSource.isInitialized) await dataSource.destroy();
    process.exit(1);
  }
};

runSeeder();
