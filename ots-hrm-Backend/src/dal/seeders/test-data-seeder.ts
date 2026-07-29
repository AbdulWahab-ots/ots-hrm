import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import {
  Company, Role, User, Department, Designation, Shift, WorkingDays,
  LeaveType, Employee, Attendance, Vacation, Benefit, EmployeeBenefit
} from "../../entities";
import { EmptyGuid, DefaultRoles, DefaultRoleDetails } from "../../constants";
import { encrypt } from "../../utility/bcrypt-utility";
import {
  Gender, ShiftType, DayName, EmployeeStatus, AttendanceStatus,
  PresentStatus, VacationStatus, RequestType, GenderSpecific, LevelHierarchy,
  BenefitType, BenefitValueType, BenefitFrequency
} from "../../models";
import { ITokenUser } from "../../models/inerfaces/tokenUser";

// ─── helpers ─────────────────────────────────────────────────────────────────

const ctx = (companyId: string): ITokenUser => ({
  name: "System",
  id: EmptyGuid,
  companyId,
  roleId: EmptyGuid,
  role: "admin",
  privileges: [],
});

// May 2025 working days (Monday–Friday only)
const MAY_WORKING_DAYS = [
  "2025-05-01", "2025-05-02",
  "2025-05-05", "2025-05-06", "2025-05-07", "2025-05-08", "2025-05-09",
  "2025-05-12", "2025-05-13", "2025-05-14", "2025-05-15", "2025-05-16",
  "2025-05-19", "2025-05-20", "2025-05-21", "2025-05-22", "2025-05-23",
  "2025-05-26", "2025-05-27", "2025-05-28", "2025-05-29", "2025-05-30",
];

// Shift attendance constants (values in decimal hours)
const MORNING = {
  checkIn: "11:00:00",
  checkOutNormal: "19:00:00",
  checkInLate: "11:25:00",
  totalWorkingHours: 8.0,            // 480 min / 60
  minimumRequiredWorkingHour: 7.5,   // (480 - 30) / 60
  lockWorkingHoursNormal: 7.0,       // (480 - 60) / 60   net after break
  lockWorkingHoursLate: 6.58,        // (455 - 60) / 60
};

const NIGHT = {
  checkIn: "17:30:00",
  checkOutNormal: "02:00:00",
  checkInLate: "17:55:00",
  totalWorkingHours: 8.5,            // 510 min / 60
  minimumRequiredWorkingHour: 8.0,   // (510 - 30) / 60
  lockWorkingHoursNormal: 7.5,       // (510 - 60) / 60
  lockWorkingHoursLate: 7.08,        // (485 - 60) / 60
};

// ─── attendance helper ────────────────────────────────────────────────────────

function buildAttendance(
  companyId: string,
  userId: string,
  shiftId: string,
  date: string,
  opts: {
    status: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    lateMinutes?: number;
    lockWorkingHours?: number;
    totalWorkingHours?: number;
    minimumRequiredWorkingHour?: number;
    vacationId?: string;
  }
): Attendance {
  const a = new Attendance();
  a.id = randomUUID();
  a.companyId = companyId;
  a.userId = userId;
  a.shiftId = shiftId;
  a.date = new Date(date) as any; // stored as date string in pg
  a.status = opts.status;
  a.checkInTime = opts.checkIn;
  a.checkOutTime = opts.checkOut;
  a.lateMinutes = opts.lateMinutes ?? 0;
  a.earlyLeaveMinutes = 0;
  a.isRemote = false;
  a.lockWorkingHours = opts.lockWorkingHours;
  a.totalWorkingHours = opts.totalWorkingHours;
  a.minimumRequiredWorkingHour = opts.minimumRequiredWorkingHour;
  a.vacationId = opts.vacationId;
  a.active = true;
  a.deleted = false;
  a.createdAt = new Date();
  a.createdBy = "System";
  a.createdById = EmptyGuid;
  return a;
}

// ─── main seeder ─────────────────────────────────────────────────────────────

export const seedTestData = async (dataSource: DataSource): Promise<void> => {
  const companyRepo    = dataSource.getRepository(Company);
  const roleRepo       = dataSource.getRepository(Role);
  const userRepo       = dataSource.getRepository(User);
  const deptRepo       = dataSource.getRepository(Department);
  const desigRepo      = dataSource.getRepository(Designation);
  const shiftRepo      = dataSource.getRepository(Shift);
  const wdRepo         = dataSource.getRepository(WorkingDays);
  const ltRepo         = dataSource.getRepository(LeaveType);
  const employeeRepo       = dataSource.getRepository(Employee);
  const attendanceRepo     = dataSource.getRepository(Attendance);
  const vacationRepo       = dataSource.getRepository(Vacation);
  const benefitRepo        = dataSource.getRepository(Benefit);
  const employeeBenefitRepo = dataSource.getRepository(EmployeeBenefit);

  // ── 0. idempotency guard ──────────────────────────────────────────────────
  const existing = await companyRepo.findOne({ where: { name: "Test Company" } });
  if (existing) {
    console.log("⚠️  Test Company already exists — skipping seeder.");
    return;
  }

  console.log("🌱 Starting test data seeder...");

  // ── 1. Company ────────────────────────────────────────────────────────────
  const company = new Company().toEntity(
    { name: "Test Company", email: "test@company.com", phoneNo: "03001234567",
      address: "123 Test Street", temporaryAddress: "", zipCode: 75500,
      country: "Pakistan", state: "Sindh", city: "Karachi" },
    undefined,
    { name: "System", id: EmptyGuid, companyId: "", roleId: "", role: "", privileges: [] }
  );
  await companyRepo.save(company);
  console.log(`✅ Company created: ${company.name} (${company.id})`);

  const c = ctx(company.id);

  // ── 2. Roles ──────────────────────────────────────────────────────────────
  const adminRoleDetails    = DefaultRoleDetails[DefaultRoles.Admin];
  const employeeRoleDetails = DefaultRoleDetails[DefaultRoles.Employee];

  const adminRole = new Role().toEntity(
    { name: adminRoleDetails.name, code: adminRoleDetails.code, privilegeIds: [] },
    undefined, c
  );
  adminRole.privileges = [];
  adminRole.isEditable = false;
  await roleRepo.save(adminRole);

  const employeeRole = new Role().toEntity(
    { name: employeeRoleDetails.name, code: employeeRoleDetails.code, privilegeIds: [] },
    undefined, c
  );
  employeeRole.privileges = [];
  employeeRole.isEditable = false;
  await roleRepo.save(employeeRole);
  console.log("✅ Roles created: Admin, Employee");

  // ── 3. Department ─────────────────────────────────────────────────────────
  const dept = new Department().toEntity(
    { name: "Engineering", description: "Software Engineering Department" },
    undefined, c
  );
  await deptRepo.save(dept);
  console.log(`✅ Department created: ${dept.name}`);

  // ── 4. Designation ────────────────────────────────────────────────────────
  const desig = new Designation().toEntity(
    { title: "Software Engineer", departmentId: dept.id,
      levelHierarchy: LevelHierarchy.MID, jobDescription: "Software development" },
    undefined, c
  );
  await desigRepo.save(desig);
  console.log(`✅ Designation created: ${desig.title}`);

  // ── 5. Shifts ─────────────────────────────────────────────────────────────
  const morningShift = new Shift().toEntity(
    { name: "Morning Shift", shiftType: ShiftType.MORNING,
      startTime: "11:00:00", endTime: "19:00:00",
      marginTime: 30, breakDuration: 60, order: 1 },
    undefined, c
  );
  await shiftRepo.save(morningShift);

  const nightShift = new Shift().toEntity(
    { name: "Night Shift", shiftType: ShiftType.NIGHT,
      startTime: "17:30:00", endTime: "02:00:00",
      marginTime: 30, breakDuration: 60, order: 2 },
    undefined, c
  );
  await shiftRepo.save(nightShift);
  console.log("✅ Shifts created: Morning Shift (11:00–19:00), Night Shift (17:30–02:00)");

  // ── 6. Working Days (Mon–Sun) ─────────────────────────────────────────────
  const workingDayConfig: { dayName: DayName; isWorkingDay: boolean }[] = [
    { dayName: DayName.MONDAY,    isWorkingDay: true  },
    { dayName: DayName.TUESDAY,   isWorkingDay: true  },
    { dayName: DayName.WEDNESDAY, isWorkingDay: true  },
    { dayName: DayName.THURSDAY,  isWorkingDay: true  },
    { dayName: DayName.FRIDAY,    isWorkingDay: true  },
    { dayName: DayName.SATURDAY,  isWorkingDay: false },
    { dayName: DayName.SUNDAY,    isWorkingDay: false },
  ];
  for (const cfg of workingDayConfig) {
    const wd = new WorkingDays().toEntity({ dayName: cfg.dayName, isWorkingDay: cfg.isWorkingDay }, undefined, c);
    await wdRepo.save(wd);
  }
  console.log("✅ Working days configured (Mon–Fri on, Sat–Sun off)");

  // ── 7. Leave Types ────────────────────────────────────────────────────────
  const annualLeave = new LeaveType().toEntity(
    { name: "Annual Leave", maxDaysPerYear: 20, maxConsecutiveDays: 14,
      isPaid: true, requiresApproval: true, canBeCarriedForward: true,
      carryForwardLimit: 5, genderSpecific: GenderSpecific.ALL },
    undefined, c
  );
  await ltRepo.save(annualLeave);

  const sickLeave = new LeaveType().toEntity(
    { name: "Sick Leave", maxDaysPerYear: 10, maxConsecutiveDays: 5,
      isPaid: true, requiresApproval: false, canBeCarriedForward: false,
      carryForwardLimit: 0, genderSpecific: GenderSpecific.ALL },
    undefined, c
  );
  await ltRepo.save(sickLeave);
  console.log("✅ Leave types created: Annual Leave, Sick Leave");

  // ── 8. Admin User ─────────────────────────────────────────────────────────
  const adminUser = new User().toEntity(
    { userName: "testadmin", email: "admin@testcompany.com",
      firstName: "Test", lastName: "Admin", gender: Gender.Male,
      roleId: adminRole.id, isGoogleSignup: false, isEmailVerified: true,
      dateOfBirth: new Date("1990-01-01"), password: "Pass@123" },
    undefined, c
  );
  adminUser.passwordHash = await encrypt("Pass@123");
  await userRepo.save(adminUser);
  console.log("✅ Admin user created: admin@testcompany.com / Pass@123");

  // ── 9. Employees ──────────────────────────────────────────────────────────
  const employeeDefs = [
    { firstName: "Ali",    lastName: "Hassan", email: "ali@testcompany.com",    userName: "ali.hassan",    salary: 80000, shift: morningShift, gender: Gender.Male   },
    { firstName: "Sara",   lastName: "Khan",   email: "sara@testcompany.com",   userName: "sara.khan",     salary: 75000, shift: morningShift, gender: Gender.Female },
    { firstName: "Ahmed",  lastName: "Raza",   email: "ahmed@testcompany.com",  userName: "ahmed.raza",    salary: 70000, shift: morningShift, gender: Gender.Male   },
    { firstName: "Fatima", lastName: "Malik",  email: "fatima@testcompany.com", userName: "fatima.malik",  salary: 65000, shift: nightShift,   gender: Gender.Female },
    { firstName: "Bilal",  lastName: "Sheikh", email: "bilal@testcompany.com",  userName: "bilal.sheikh",  salary: 60000, shift: nightShift,   gender: Gender.Male   },
  ];

  const employees: { user: User; employee: Employee; shift: Shift }[] = [];

  for (let i = 0; i < employeeDefs.length; i++) {
    const def = employeeDefs[i];
    const empCode = `EMP-${String(i + 1).padStart(3, "0")}`;

    const user = new User().toEntity(
      { userName: def.userName, email: def.email, firstName: def.firstName,
        lastName: def.lastName, gender: def.gender, roleId: employeeRole.id,
        isGoogleSignup: false, isEmailVerified: true,
        dateOfBirth: new Date("1992-06-15"), password: "Pass@123" },
      undefined, c
    );
    user.passwordHash = await encrypt("Pass@123");
    await userRepo.save(user);

    const employee = new Employee().toEntity(
      { userId: user.id, employeeCode: empCode, departmentId: dept.id,
        designationId: desig.id, shiftId: def.shift.id,
        joiningDate: new Date("2024-01-01"), salary: def.salary,
        status: EmployeeStatus.PERMANENT,
        user: { userName: def.userName, email: def.email, firstName: def.firstName,
                lastName: def.lastName, gender: def.gender,
                isGoogleSignup: false, isEmailVerified: true,
                dateOfBirth: new Date("1992-06-15"), password: "Pass@123" } },
      undefined, c
    );
    await employeeRepo.save(employee);

    employees.push({ user, employee, shift: def.shift });
    console.log(`✅ Employee created: ${def.firstName} ${def.lastName} (${empCode})`);
  }

  const [ali, sara, ahmed, fatima, bilal] = employees;

  // ── 10. Benefits ──────────────────────────────────────────────────────────
  // 3 company-wide benefits:
  //   - House Rent Allowance  → PERCENTAGE 40% of basic salary (MONTHLY)
  //   - Medical Allowance     → FIXED 5,000 PKR (MONTHLY)
  //   - Transport Allowance   → FIXED 3,000 PKR (MONTHLY)

  const hraBonus = new Benefit().toEntity(
    { name: "House Rent Allowance", type: BenefitType.OTHER,
      value: 40, valueType: BenefitValueType.PERCENTAGE,
      frequency: BenefitFrequency.MONTHLY,
      description: "40% of basic salary paid as house rent allowance",
      startDate: new Date("2024-01-01") },
    undefined, c
  );
  await benefitRepo.save(hraBonus);

  const medicalAllowance = new Benefit().toEntity(
    { name: "Medical Allowance", type: BenefitType.HEALTH,
      value: 5000, valueType: BenefitValueType.FIXED,
      frequency: BenefitFrequency.MONTHLY,
      description: "Monthly medical allowance",
      startDate: new Date("2024-01-01") },
    undefined, c
  );
  await benefitRepo.save(medicalAllowance);

  const transportAllowance = new Benefit().toEntity(
    { name: "Transport Allowance", type: BenefitType.TRANSPORTATION,
      value: 3000, valueType: BenefitValueType.FIXED,
      frequency: BenefitFrequency.MONTHLY,
      description: "Monthly transport allowance",
      startDate: new Date("2024-01-01") },
    undefined, c
  );
  await benefitRepo.save(transportAllowance);
  console.log("✅ Benefits created: HRA (40%), Medical (5,000), Transport (3,000)");

  // ── 10b. Assign Benefits to Employees ────────────────────────────────────
  // Each employee gets all 3 benefits.
  // HRA customValue = 40% of that employee's basic salary (pre-calculated here
  // so the payroll engine can read an exact PKR figure without needing to
  // resolve the percentage against each salary separately).

  const benefitAssignments: { emp: typeof employees[0]; benefitId: string; customValue?: number }[] = [];

  for (const emp of employees) {
    const hraPKR = Math.round(emp.employee.salary! * 0.40);   // 40% of basic
    benefitAssignments.push(
      { emp, benefitId: hraBonus.id,           customValue: hraPKR   },
      { emp, benefitId: medicalAllowance.id,   customValue: undefined }, // use default 5,000
      { emp, benefitId: transportAllowance.id, customValue: undefined }, // use default 3,000
    );
  }

  for (const { emp, benefitId, customValue } of benefitAssignments) {
    const eb = new EmployeeBenefit().toEntity(
      { userId: emp.user.id, employeeId: emp.employee.id,
        benefitId, effectiveDate: new Date("2024-01-01"),
        customValue, notes: undefined },
      undefined, c
    );
    await employeeBenefitRepo.save(eb);
  }
  console.log("✅ Benefits assigned to all 5 employees");
  console.log("   Gross salary breakdown (basic + HRA 40% + medical 5k + transport 3k):");
  for (const emp of employees) {
    const basic     = emp.employee.salary!;
    const hra       = Math.round(basic * 0.40);
    const gross     = basic + hra + 5000 + 3000;
    const firstName = emp.user.firstName;
    console.log(`   ${firstName.padEnd(8)}: ${basic.toLocaleString()} + ${hra.toLocaleString()} + 8,000 = ${gross.toLocaleString()} PKR`);
  }

  // ── 11. Leave (Vacation) Records ─────────────────────────────────────────
  // Ahmed: Annual Leave May 12–13 (APPROVED)
  const ahmedLeave = new Vacation().toEntity(
    { requestedBy: ahmed.user.id, fromDate: new Date("2025-05-12"),
      toDate: new Date("2025-05-13"), reason: "Personal work",
      typeId: annualLeave.id, status: VacationStatus.APPROVED,
      actionBy: adminUser.id, actionAt: new Date("2025-05-10"),
      requestType: RequestType.LEAVE },
    undefined, c
  );
  await vacationRepo.save(ahmedLeave);

  // Bilal: Sick Leave May 19–20 (APPROVED)
  const bilalLeave = new Vacation().toEntity(
    { requestedBy: bilal.user.id, fromDate: new Date("2025-05-19"),
      toDate: new Date("2025-05-20"), reason: "Not feeling well",
      typeId: sickLeave.id, status: VacationStatus.APPROVED,
      actionBy: adminUser.id, actionAt: new Date("2025-05-18"),
      requestType: RequestType.LEAVE },
    undefined, c
  );
  await vacationRepo.save(bilalLeave);

  // Sara: Annual Leave May 26 (PENDING)
  const saraLeave = new Vacation().toEntity(
    { requestedBy: sara.user.id, fromDate: new Date("2025-05-26"),
      toDate: new Date("2025-05-26"), reason: "Family event",
      typeId: annualLeave.id, status: VacationStatus.PENDING,
      requestType: RequestType.LEAVE },
    undefined, c
  );
  await vacationRepo.save(saraLeave);

  console.log("✅ Leave records created: Ahmed (approved), Bilal (approved), Sara (pending)");

  // ── 11. Attendance — May 2025 ─────────────────────────────────────────────
  const attendanceRecords: Attendance[] = [];

  for (const date of MAY_WORKING_DAYS) {
    // ── Ali Hassan: PRESENT all 22 days (Morning Shift) ───────────────────
    attendanceRecords.push(buildAttendance(company.id, ali.user.id, morningShift.id, date, {
      status: AttendanceStatus.PRESENT,
      checkIn: MORNING.checkIn, checkOut: MORNING.checkOutNormal,
      lockWorkingHours: MORNING.lockWorkingHoursNormal,
      totalWorkingHours: MORNING.totalWorkingHours,
      minimumRequiredWorkingHour: MORNING.minimumRequiredWorkingHour,
    }));

    // ── Sara Khan: ABSENT May 7, May 14; rest PRESENT (Morning Shift) ─────
    if (date === "2025-05-07" || date === "2025-05-14") {
      attendanceRecords.push(buildAttendance(company.id, sara.user.id, morningShift.id, date, {
        status: AttendanceStatus.ABSENT,
      }));
    } else {
      attendanceRecords.push(buildAttendance(company.id, sara.user.id, morningShift.id, date, {
        status: AttendanceStatus.PRESENT,
        checkIn: MORNING.checkIn, checkOut: MORNING.checkOutNormal,
        lockWorkingHours: MORNING.lockWorkingHoursNormal,
        totalWorkingHours: MORNING.totalWorkingHours,
        minimumRequiredWorkingHour: MORNING.minimumRequiredWorkingHour,
      }));
    }

    // ── Ahmed Raza: ON_LEAVE May 12–13; rest PRESENT (Morning Shift) ──────
    if (date === "2025-05-12" || date === "2025-05-13") {
      attendanceRecords.push(buildAttendance(company.id, ahmed.user.id, morningShift.id, date, {
        status: AttendanceStatus.ON_LEAVE,
        vacationId: ahmedLeave.id,
      }));
    } else {
      attendanceRecords.push(buildAttendance(company.id, ahmed.user.id, morningShift.id, date, {
        status: AttendanceStatus.PRESENT,
        checkIn: MORNING.checkIn, checkOut: MORNING.checkOutNormal,
        lockWorkingHours: MORNING.lockWorkingHoursNormal,
        totalWorkingHours: MORNING.totalWorkingHours,
        minimumRequiredWorkingHour: MORNING.minimumRequiredWorkingHour,
      }));
    }

    // ── Fatima Malik: LATE on May 5, 12, 19; rest PRESENT (Night Shift) ───
    if (date === "2025-05-05" || date === "2025-05-12" || date === "2025-05-19") {
      attendanceRecords.push(buildAttendance(company.id, fatima.user.id, nightShift.id, date, {
        status: AttendanceStatus.LATE,
        checkIn: NIGHT.checkInLate, checkOut: NIGHT.checkOutNormal,
        lateMinutes: 25,
        lockWorkingHours: NIGHT.lockWorkingHoursLate,
        totalWorkingHours: NIGHT.totalWorkingHours,
        minimumRequiredWorkingHour: NIGHT.minimumRequiredWorkingHour,
      }));
    } else {
      attendanceRecords.push(buildAttendance(company.id, fatima.user.id, nightShift.id, date, {
        status: AttendanceStatus.PRESENT,
        checkIn: NIGHT.checkIn, checkOut: NIGHT.checkOutNormal,
        lockWorkingHours: NIGHT.lockWorkingHoursNormal,
        totalWorkingHours: NIGHT.totalWorkingHours,
        minimumRequiredWorkingHour: NIGHT.minimumRequiredWorkingHour,
      }));
    }

    // ── Bilal Sheikh: ON_LEAVE May 19–20; ABSENT May 9; rest PRESENT (Night) ─
    if (date === "2025-05-19" || date === "2025-05-20") {
      attendanceRecords.push(buildAttendance(company.id, bilal.user.id, nightShift.id, date, {
        status: AttendanceStatus.ON_LEAVE,
        vacationId: bilalLeave.id,
      }));
    } else if (date === "2025-05-09") {
      attendanceRecords.push(buildAttendance(company.id, bilal.user.id, nightShift.id, date, {
        status: AttendanceStatus.ABSENT,
      }));
    } else {
      attendanceRecords.push(buildAttendance(company.id, bilal.user.id, nightShift.id, date, {
        status: AttendanceStatus.PRESENT,
        checkIn: NIGHT.checkIn, checkOut: NIGHT.checkOutNormal,
        lockWorkingHours: NIGHT.lockWorkingHoursNormal,
        totalWorkingHours: NIGHT.totalWorkingHours,
        minimumRequiredWorkingHour: NIGHT.minimumRequiredWorkingHour,
      }));
    }
  }

  // Bulk insert attendance (batches of 50 to avoid param limits)
  const BATCH = 50;
  for (let i = 0; i < attendanceRecords.length; i += BATCH) {
    await attendanceRepo.save(attendanceRecords.slice(i, i + BATCH));
  }
  console.log(`✅ Attendance records created: ${attendanceRecords.length} records for May 2025`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n🎉 Test data seeder completed!");
  console.log("─────────────────────────────────────────────");
  console.log("🏢 Company    : Test Company");
  console.log("👤 Admin      : admin@testcompany.com / Pass@123");
  console.log("👥 Employees  : 5  (ali, sara, ahmed, fatima, bilal) — all Pass@123");
  console.log("📅 Attendance : May 2025 (22 working days)");
  console.log("🌴 Leaves     : 3 records (Ahmed approved, Bilal approved, Sara pending)");
  console.log("💰 Benefits   : HRA 40% + Medical 5,000 + Transport 3,000 → assigned to all");
  console.log("─────────────────────────────────────────────\n");
};
