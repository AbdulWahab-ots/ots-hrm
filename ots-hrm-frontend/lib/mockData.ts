// In-memory fixtures for the mock API layer (lib/mockApi.ts).
// Everything here lives only for the lifetime of the page/tab - a refresh resets it.

let idCounter = 1;
export const genId = (prefix: string) => `${prefix}-${(idCounter++).toString().padStart(4, "0")}`;

export const now = () => new Date().toISOString();

const auditFields = () => ({
  active: true,
  createdAt: now(),
  createdBy: "System",
  createdById: "sys-0000",
  modifiedAt: null,
  modifiedBy: null,
  modifiedById: null,
});

export const COMPANY_ID = "company-0001";

export const companies = [
  {
    id: COMPANY_ID,
    ...auditFields(),
    name: "Acme HR Demo",
    phoneNo: "+1 555 010 0000",
    email: "hello@acmehr.demo",
    address: "123 Demo Street",
    temporaryAddress: "",
    zipCode: 10001,
    country: "USA",
    state: "New York",
    city: "New York",
    logoUrl: null,
    users: [] as any[],
  },
];

export const roles = [
  { id: "role-superadmin", ...auditFields(), name: "Super Admin", code: "superAdmin", companyId: undefined, privileges: [] as string[] },
  { id: "role-admin", ...auditFields(), name: "Company Admin", code: "admin", companyId: COMPANY_ID, privileges: [] as string[] },
  { id: "role-employee", ...auditFields(), name: "Employee", code: "employee", companyId: COMPANY_ID, privileges: [] as string[] },
];

export const departments = [
  {
    id: "dept-0001",
    ...auditFields(),
    companyId: COMPANY_ID,
    name: "Engineering",
    code: "ENG",
    description: "Builds and maintains the product",
    parentId: null,
    sortOrder: 1,
    children: [],
    designations: [],
    workingDays: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, dayName: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d], isWorkingDay: true, notes: null })),
    shifts: [],
    benefits: [],
  },
  {
    id: "dept-0002",
    ...auditFields(),
    companyId: COMPANY_ID,
    name: "Human Resources",
    code: "HR",
    description: "People operations",
    parentId: null,
    sortOrder: 2,
    children: [],
    designations: [],
    workingDays: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, dayName: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d], isWorkingDay: true, notes: null })),
    shifts: [],
    benefits: [],
  },
  {
    id: "dept-0003",
    ...auditFields(),
    companyId: COMPANY_ID,
    name: "Sales",
    code: "SALES",
    description: "Revenue and growth",
    parentId: null,
    sortOrder: 3,
    children: [],
    designations: [],
    workingDays: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, dayName: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d], isWorkingDay: true, notes: null })),
    shifts: [],
    benefits: [],
  },
  {
    id: "dept-0004",
    ...auditFields(),
    companyId: COMPANY_ID,
    name: "Finance",
    code: "FIN",
    description: "Accounting and payroll",
    parentId: null,
    sortOrder: 4,
    children: [],
    designations: [],
    workingDays: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, dayName: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d], isWorkingDay: true, notes: null })),
    shifts: [],
    benefits: [],
  },
];

const deptRef = (id: string) => {
  const d = departments.find((x) => x.id === id)!;
  return { id: d.id, name: d.name, code: d.code, description: d.description };
};

export const designations = [
  { id: "desg-0001", ...auditFields(), companyId: COMPANY_ID, departmentId: "dept-0001", title: "Software Engineer", code: "SWE", jobDescription: "Writes and maintains software", levelHierarchy: "Mid", responsibilities: "Feature development, code review", sortOrder: 1, department: deptRef("dept-0001") },
  { id: "desg-0002", ...auditFields(), companyId: COMPANY_ID, departmentId: "dept-0001", title: "Engineering Manager", code: "EM", jobDescription: "Leads the engineering team", levelHierarchy: "Senior", responsibilities: "Team management, planning", sortOrder: 2, department: deptRef("dept-0001") },
  { id: "desg-0003", ...auditFields(), companyId: COMPANY_ID, departmentId: "dept-0002", title: "HR Specialist", code: "HRS", jobDescription: "Handles employee relations", levelHierarchy: "Mid", responsibilities: "Onboarding, benefits", sortOrder: 1, department: deptRef("dept-0002") },
  { id: "desg-0004", ...auditFields(), companyId: COMPANY_ID, departmentId: "dept-0003", title: "Sales Executive", code: "SE", jobDescription: "Drives new business", levelHierarchy: "Mid", responsibilities: "Prospecting, closing deals", sortOrder: 1, department: deptRef("dept-0003") },
  { id: "desg-0005", ...auditFields(), companyId: COMPANY_ID, departmentId: "dept-0004", title: "Accountant", code: "ACC", jobDescription: "Manages the books", levelHierarchy: "Mid", responsibilities: "Bookkeeping, payroll", sortOrder: 1, department: deptRef("dept-0004") },
];

export const shifts = [
  { id: "shift-0001", ...auditFields(), companyId: COMPANY_ID, name: "Morning Shift", code: "MORN", shiftType: "FIXED", startTime: "09:00", endTime: "17:00", workingHours: 8, breakDuration: 60, order: 1, departmentId: "dept-0001", department: deptRef("dept-0001") },
  { id: "shift-0002", ...auditFields(), companyId: COMPANY_ID, name: "Evening Shift", code: "EVE", shiftType: "FIXED", startTime: "14:00", endTime: "22:00", workingHours: 8, breakDuration: 60, order: 2, departmentId: "dept-0003", department: deptRef("dept-0003") },
];

export const benefits = [
  { id: "benefit-0001", ...auditFields(), companyId: COMPANY_ID, name: "Health Insurance", code: "HEALTH", description: "Full medical coverage", type: "HEALTH", value: "300.00", valueType: "FIXED", frequency: "MONTHLY", startDate: now(), endDate: "", sortOrder: 1, departmentId: null, department: undefined },
  { id: "benefit-0002", ...auditFields(), companyId: COMPANY_ID, name: "Transportation Allowance", code: "TRANSPORT", description: "Commute reimbursement", type: "TRANSPORTATION", value: "100.00", valueType: "FIXED", frequency: "MONTHLY", startDate: now(), endDate: "", sortOrder: 2, departmentId: null, department: undefined },
];

export const leaveTypes = [
  { id: "leave-0001", ...auditFields(), companyId: COMPANY_ID, departmentId: null, department: undefined, name: "Annual Leave", code: "ANNUAL", description: "Paid yearly leave", maxDaysPerYear: 20, maxConsecutiveDays: 10, isPaid: true, requiresApproval: true, canBeCarriedForward: true, carryForwardLimit: 5, genderSpecific: "all" },
  { id: "leave-0002", ...auditFields(), companyId: COMPANY_ID, departmentId: null, department: undefined, name: "Sick Leave", code: "SICK", description: "Medical leave", maxDaysPerYear: 10, maxConsecutiveDays: 5, isPaid: true, requiresApproval: false, canBeCarriedForward: false, carryForwardLimit: 0, genderSpecific: "all" },
  { id: "leave-0003", ...auditFields(), companyId: COMPANY_ID, departmentId: null, department: undefined, name: "Casual Leave", code: "CASUAL", description: "Short personal leave", maxDaysPerYear: 7, maxConsecutiveDays: 3, isPaid: true, requiresApproval: true, canBeCarriedForward: false, carryForwardLimit: 0, genderSpecific: "all" },
];

export const holidays = [
  { id: "holiday-0001", ...auditFields(), companyId: COMPANY_ID, name: "New Year's Day", dates: [`${new Date().getFullYear()}-01-01`], isMultiple: false, type: "PUBLIC", description: "New Year's Day", whichCountryId: null, departmentId: null, department: undefined },
  { id: "holiday-0002", ...auditFields(), companyId: COMPANY_ID, name: "Independence Day", dates: [`${new Date().getFullYear()}-07-04`], isMultiple: false, type: "PUBLIC", description: "Independence Day", whichCountryId: null, departmentId: null, department: undefined },
];

export const countries = [
  { id: "country-us", ...auditFields(), name: "United States", code: "US", iso2: "US", capital: "Washington, D.C.", continent: "North America", currency: "USD", phone: "1" },
  { id: "country-ca", ...auditFields(), name: "Canada", code: "CA", iso2: "CA", capital: "Ottawa", continent: "North America", currency: "CAD", phone: "1" },
  { id: "country-gb", ...auditFields(), name: "United Kingdom", code: "GB", iso2: "GB", capital: "London", continent: "Europe", currency: "GBP", phone: "44" },
  { id: "country-pk", ...auditFields(), name: "Pakistan", code: "PK", iso2: "PK", capital: "Islamabad", continent: "Asia", currency: "PKR", phone: "92" },
  { id: "country-ae", ...auditFields(), name: "United Arab Emirates", code: "AE", iso2: "AE", capital: "Abu Dhabi", continent: "Asia", currency: "AED", phone: "971" },
];

// ---- Users (one per demo role) + additional employee users for table data ----

function makeUser(opts: {
  id: string; userName: string; email: string; firstName: string; lastName: string; roleId: string;
}) {
  return {
    id: opts.id,
    ...auditFields(),
    companyId: COMPANY_ID,
    userName: opts.userName,
    email: opts.email,
    firstName: opts.firstName,
    middleName: null,
    lastName: opts.lastName,
    pictureUrl: null,
    dateOfBirth: null,
    gender: "other",
    status: 0,
    lastLogin: null,
    lastOnline: null,
    roleId: opts.roleId,
    isGoogleSignup: false,
    isEmailVerified: "true",
    isPhoneVerified: null,
    phoneNumber: null,
  };
}

export const superAdminUser = makeUser({ id: "user-superadmin", userName: "superadmin", email: "superadmin@acmehr.demo", firstName: "Super", lastName: "Admin", roleId: "role-superadmin" });
export const adminUser = makeUser({ id: "user-admin", userName: "admin", email: "admin@acmehr.demo", firstName: "Company", lastName: "Admin", roleId: "role-admin" });
export const employeeUser = makeUser({ id: "user-employee", userName: "employee", email: "employee@acmehr.demo", firstName: "Jordan", lastName: "Employee", roleId: "role-employee" });

export const users = [superAdminUser, adminUser, employeeUser];

function roleOf(user: typeof adminUser) {
  const r = roles.find((r) => r.id === user.roleId)!;
  return { id: r.id, active: r.active, createdAt: r.createdAt, createdBy: r.createdBy, createdById: r.createdById, modifiedAt: r.modifiedAt, modifiedBy: r.modifiedBy, modifiedById: r.modifiedById, name: r.name, code: r.code, privileges: r.privileges };
}

function companyOf() {
  const c = companies[0];
  return { ...c };
}

export function userToProfile(user: typeof adminUser) {
  return {
    ...user,
    company: companyOf(),
    role: roleOf(user),
  };
}

// Employee records (linked to users). Employee/admin/superadmin all log in via /auth/login;
// only "employee"-role users have a linked Employee record in this demo dataset.
export const employees = [
  {
    id: "emp-0001",
    ...auditFields(),
    companyId: COMPANY_ID,
    userId: employeeUser.id,
    employeeCode: "EMP-001",
    departmentId: "dept-0001",
    designationId: "desg-0001",
    shiftId: "shift-0001",
    joiningDate: "2024-01-15",
    salary: 6500,
    status: "ACTIVE",
    phoneNumber: "+1 555 010 1111",
    benefitId: "benefit-0001",
    bankName: "First National Bank",
    ibanNumber: "US00FNB000123456789",
    accountNumber: "000123456789",
    user: { id: employeeUser.id, active: true, createdAt: employeeUser.createdAt, createdBy: employeeUser.createdBy, createdById: employeeUser.createdById, modifiedAt: null, modifiedBy: null, modifiedById: null, companyId: COMPANY_ID, userName: employeeUser.userName, email: employeeUser.email, firstName: employeeUser.firstName, lastName: employeeUser.lastName, pictureUrl: null },
    department: departments[0],
    designation: designations[0],
    shift: shifts[0],
    benefit: benefits[0],
  },
  {
    id: "emp-0002",
    ...auditFields(),
    companyId: COMPANY_ID,
    userId: genId("user"),
    employeeCode: "EMP-002",
    departmentId: "dept-0003",
    designationId: "desg-0004",
    shiftId: "shift-0002",
    joiningDate: "2024-03-01",
    salary: 5200,
    status: "ACTIVE",
    phoneNumber: "+1 555 010 2222",
    benefitId: "benefit-0002",
    bankName: "First National Bank",
    ibanNumber: "US00FNB000987654321",
    accountNumber: "000987654321",
    user: { id: "user-taylor", active: true, createdAt: now(), createdBy: "System", createdById: "sys-0000", modifiedAt: null, modifiedBy: null, modifiedById: null, companyId: COMPANY_ID, userName: "taylor.sales", email: "taylor@acmehr.demo", firstName: "Taylor", lastName: "Rivera", pictureUrl: null },
    department: departments[2],
    designation: designations[3],
    shift: shifts[1],
    benefit: benefits[1],
  },
  {
    id: "emp-0003",
    ...auditFields(),
    companyId: COMPANY_ID,
    userId: genId("user"),
    employeeCode: "EMP-003",
    departmentId: "dept-0002",
    designationId: "desg-0003",
    shiftId: "shift-0001",
    joiningDate: "2023-11-20",
    salary: 4800,
    status: "ACTIVE",
    phoneNumber: "+1 555 010 3333",
    benefitId: "benefit-0001",
    bankName: "First National Bank",
    ibanNumber: "US00FNB000555666777",
    accountNumber: "000555666777",
    user: { id: "user-morgan", active: true, createdAt: now(), createdBy: "System", createdById: "sys-0000", modifiedAt: null, modifiedBy: null, modifiedById: null, companyId: COMPANY_ID, userName: "morgan.hr", email: "morgan@acmehr.demo", firstName: "Morgan", lastName: "Lee", pictureUrl: null },
    department: departments[1],
    designation: designations[2],
    shift: shifts[0],
    benefit: benefits[0],
  },
];

export const invites: any[] = [];

export const attendanceRecords = employees.map((emp, i) => ({
  id: genId("attendance"),
  active: true,
  createdAt: now(),
  createdBy: "System",
  createdById: "sys-0000",
  modifiedAt: null,
  modifiedBy: null,
  modifiedById: null,
  companyId: COMPANY_ID,
  userId: emp.userId,
  employee: { id: emp.id, name: `${emp.user.firstName} ${emp.user.lastName}`, designation: emp.designation.title, profileUrl: undefined },
  department: { id: emp.department.id, name: emp.department.name },
  status: i === 1 ? "Late" : "PRESENT",
  isLate: i === 1,
  checkInTime: "09:0" + i,
  checkOutTime: "17:0" + i,
  totalHours: 8,
  shift: emp.shift.name.includes("Morning") ? "Morning" : "Evening",
  shiftId: emp.shiftId,
  date: now().slice(0, 10),
  comment: null,
}));

export const requests: any[] = [
  {
    id: genId("request"),
    ...auditFields(),
    companyId: COMPANY_ID,
    code: "REQ-001",
    userId: employeeUser.id,
    attendanceId: attendanceRecords[0]?.id ?? "",
    type: "Check In",
    date: now().slice(0, 10),
    time: "09:15",
    reason: "Traffic delay",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    user: {
      id: employeeUser.id,
      userName: employeeUser.userName,
      email: employeeUser.email,
      firstName: employeeUser.firstName,
      lastName: employeeUser.lastName,
      pictureUrl: null,
      employee: { id: employees[0].id, designation: { title: employees[0].designation.title }, department: { id: employees[0].department.id, name: employees[0].department.name } },
    },
  },
];

export const vacations: any[] = [
  {
    id: genId("vacation"),
    createdById: employeeUser.id,
    name: "Annual leave request",
    requestedByUser: { id: employeeUser.id, userName: employeeUser.userName, firstName: employeeUser.firstName, lastName: employeeUser.lastName, middleName: null, pictureUrl: null },
    department: { id: departments[0].id, name: departments[0].name },
    leaveType: { id: leaveTypes[0].id, name: leaveTypes[0].name, department: { id: departments[0].id, name: departments[0].name } },
    fromDate: now().slice(0, 10),
    toDate: now().slice(0, 10),
    status: "PENDING",
    reason: "Family trip",
    createdAt: now(),
    actionAt: null,
    totalDays: 3,
  },
];

export const payrolls = employees.map((emp) => ({
  id: genId("payroll"),
  ...auditFields(),
  companyId: COMPANY_ID,
  userId: emp.userId,
  employeeId: emp.id,
  departmentId: emp.departmentId,
  employee: emp,
  department: emp.department,
  payrollMonth: new Date().getMonth() + 1,
  payrollYear: new Date().getFullYear(),
  grossPay: emp.salary,
  netPay: Math.round(Number(emp.salary) * 0.85),
  deductions: Math.round(Number(emp.salary) * 0.15),
  status: "PENDING",
  adjustments: [] as any[],
}));

// ---- Dummy login credentials (mock mode only) ----
export const DUMMY_CREDENTIALS = [
  { userName: "superadmin", password: "super123", user: superAdminUser },
  { userName: "admin", password: "admin123", user: adminUser },
  { userName: "employee", password: "employee123", user: employeeUser },
];
