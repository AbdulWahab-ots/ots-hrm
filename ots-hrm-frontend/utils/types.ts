// import { LucideIcon } from 'lucide-react';



export type ViewType = 'dashboard' | 'employees';

export interface NavigationProps {
  navigateTo: (view: 'dashboard' | 'employees') => void;
}

// export interface AttendanceData {
//   present: number;
//   late: number;
//   permission: number;
//   absent: number;
// }

// export interface AttendanceCardProps {
//   title: string;
//   value: string;
//   percentage: string;
//   iconColor: string;
//   progressWidth: string;
//   trendText: string;
//   iconPath: string;
// }

// export interface TopPerformer {
//   name: string;
//   image: string;
//   jobTitle: string;
//   performance: string;
// }

// export interface StatsOverviewProps {
//   attendanceData: AttendanceData;
//   checkInOutData: Employee[];
//   topPerformer: TopPerformer;
// }

export interface InputFieldProps {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;
  className?: string;
  leftIcon?: React.ComponentType<{ className?: string }>; // Accepts component directly
  rightIcon?: React.ComponentType<{ className?: string }>; // Accepts component directly
  hideLabel?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPriceField?: boolean;
}
// export interface LeavesCardProps {
//   title: string;
//   value: number | string;
//   icon: LucideIcon;
//   iconColor: string;
//   bgImage: string;
// }

export interface DateRangeDropdownProps {
  value: string;
  onChange: (value: string) => void;
}



export interface Leave {
  id: string;
  employee: string;
  employeeImage: string;
  leaveType: string;
  
  from: string;
  to: string;
  days: number;
  department: string;
  isPlanned: boolean;
  isPending: boolean;
}
export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  id: string;
  name: string;
  label?: string;
  options: DropdownOption[];
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}

// export interface PerformanceIndicator {
//   id: string;
//   designation: string;
//   department: string;
//   approvedBy: string;
//   createdDate: string;
//   status: "Active" | "Inactive";
// }



// export type DataTableProps = {
//   filteredLeaves?: Leave[] | User[];
//   indicators?: PerformanceIndicator[];
//   holidays?: Holiday[];
//   filteredUsers?: User[];
// };

export type User = {
  id: string | number;
  name: string;
  email: string;
  createdDate: string;
  role: "Employee" | "Client";
  status: "Active" | "Inactive";
  image: string;
};

// export interface DashboardHeaderProps {
//   user: {
//     image: string;
//     name: string;
//     pendingApprovals: number;
//     leaveRequests: number;
//   };
// }

export interface SignInFormValues {
  userName: string;
  password: string;
  // rememberMe?: boolean;
}

export interface SignUpFormValues {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreeTerms?: boolean;
}

export interface VerifyCodeAfterSignUpProps {
  userId: string;
  code: string;
  whichPurpose: string
}

export interface ForgotPasswordFormValues {
  email: string;
}

// export interface Attendance {
//   totalWorkingDays: number;
//   daysPresent: number;
//   daysAbsent: number;
//   daysLate: number;
//   clockInTime: string;
// }

// export interface AlertItem {
//   icon: React.ReactNode;
//   text: string;
// }

// export interface EmployeeDashboardCardProps {
//   title: string;
//   type: 'attendance' | 'payslip' | 'alerts';
//   attendanceData?: Attendance;
//   alerts?: AlertItem[];
// }

export interface ResetFormProps {
  newPassword: string;
  confirmPassword: string;
}
 
export interface CreateCompanyFormValues {
  name: string;
  email: string;

}
export interface AddUserFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface InviteUserFormValues {
  email: string;
}
export interface BasicInfoFormValues {
  firstName: string;
  lastName: string;
  email: string;
}
export interface PasswordSecurityFormValues {
   currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
}
// types/company.ts (create a new file if it doesn't exist)
export interface DefaultUser {
  username: string;
  email: string;
  password: string;
}

export interface InvitedUser {
  email: string;
}

export interface CreateCompanyPayload {
  name: string;
  email: string;
  phoneNo?: string;
  address?: string;
  temporaryAddress?: string;
  zipCode?: number;
  country?: string;
  state?: string;
  city?: string;
  logo?: File;
  defaultUser?: DefaultUser[];
  invites?: InvitedUser[];
}
export interface PagedListRequest {
  pageNo: number;
  pageSize: number;
  getAllRecords: boolean;
}

export interface SortRequest {
  field: string;
  direction: number;
  priority: number;
}

export interface QueryOptionsRequest {
  filtersRequest: FilterRequest[];
  sortRequest: SortRequest[];
  includes: string[];
}

export interface GetCompaniesPayload {
  pagedListRequest: PagedListRequest;
  queryOptionsRequest: QueryOptionsRequest;
}

export interface Users {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  userName: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  pictureUrl: string | null;
  dateOfBirth: string | null;
  gender: string;
  status: number;
  lastLogin: string | null;
  lastOnline: string | null;
  roleId: string;
  isGoogleSignup: boolean;
  isEmailVerified: string | null;
  isPhoneVerified: string | null;
  phoneNumber: string | null;
}

export interface Company {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  name: string;
  phoneNo: string;
  email: string;
  address: string | null;
  temporaryAddress: string | null;
  zipCode: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  logoUrl: string | null;
  users: Users[];
  selected?: boolean;
}

export interface GetCompaniesResponse {
  success: boolean;
  message: string;
  result: {
    data: Company[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}
export interface Company {
  id: string;
  Name: string;
  email: string;
}

export interface CreateCompanyFormValues {
  name: string;
  email: string;
}
export interface FilterRequest {
  field: string;
  operator: number;
  matchMode: number;
  value?: string | boolean | number; // For single-value filters like active
  rangeValues?: {
    start: string;
    end: string;
  }; // For range-based filters like createdAt
}

export interface Department {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string | null;
  createdById: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number | null;
  children: Department[];
  designations: string[];
  workingDays: {
    dayOfWeek: number;
    dayName: string;
    isWorkingDay: boolean;
    notes: string | null;
  }[];
  shifts: string[];
  benefits: string[];
  selected?: boolean;
}

export interface GetDepartmentsPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: any;
      rangeValues?: {
        start: string;
        end: string;
      };
    }>;
    sortRequest: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes: string[];
  };
}

export interface GetDepartmentsResponse {
  success: boolean;
  message: string;
  result: {
    data: Department[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}


export interface LeaveType {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  departmentId: string | null;
    department?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
  name: string;
  code: string;
  description: string | null;
  maxDaysPerYear: number |null;
  maxConsecutiveDays: number |null;
  isPaid: boolean;
  requiresApproval: boolean;
  canBeCarriedForward: boolean;
  carryForwardLimit: number;
  genderSpecific: string;
  selected?: boolean;
}

export interface GetLeaveTypesPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetLeaveTypesResponse {
  success: boolean;
  message: string;
  result: {
    data: LeaveType[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}

export interface LeaveTypePayload {
  name: string;

  description: string;
  maxDaysPerYear: number |string;
  maxConsecutiveDays: number |string;
  isPaid: boolean;
  requiresApproval: boolean;
  departmentId: string;
}



export interface DefaultAdmin {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}



export interface SignUpWithInvitePayload {
  inviteToken: string;
  userName: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface SignUpInviteFormValues {
  inviteToken: string;
  userName: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string; // Added for form validation
}
export interface Holiday {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  dates: string[];
  isMultiple: boolean;
  type: string;
  description: string;
  whichCountryId: string | null;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
    description: string;
  };
  selected?: boolean;
}

export interface HolidayPayload {
  name: string;
  dates: string[];
  isMultiple: boolean;
  type: string;
  description: string;
  whichCountryId: string;
  departmentId: string;
}

export interface GetHolidaysPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string;
      ignoreCase?: boolean;
      rangeValues?: {
        start: string;
        end: string;
      };
    }>;
    sortRequest: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetHolidaysResponse {
  success: boolean;
  message: string;
  result: {
    data: Holiday[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}

export interface Country {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  name: string;
  code: string;
  iso2: string;
  capital: string;
  continent: string;
  currency: string;
  phone: string;
}

export interface GetCountriesPayload {
  pagedListRequest: {
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string;
      ignoreCase?: boolean;
    }>;
    sortRequest: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
  };
}

export interface GetCountriesResponse {
  data: Country[];
  total: number;
  pageStartsFrom: number;
  pageEndsAt: number;
  numberOfPages: number;
}

export interface DropdownProps {
  id: string;
  name: string;
  label?: string;
  options: DropdownOption[];
  className?: string;
  // value: string |undefined;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export interface Shift {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  breakDuration: number;
  order: number;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
  selected?: boolean;
}

export interface ShiftPayload {
  name: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  breakDuration: number | string;
  departmentId: string;
}

export interface GetShiftsPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetShiftsResponse {
  success: boolean;
  message: string;
  result: {
    data: Shift[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}

// Existing types (kept for completeness)
export interface Department {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string | null;
  createdById: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number | null;
  children: Department[];
  designations: string[];
  workingDays: {
    dayOfWeek: number;
    dayName: string;
    isWorkingDay: boolean;
    notes: string | null;
  }[];
  shifts: string[];
  benefits: string[];
  selected?: boolean;
}

export interface FilterRequest {
  field: string;
  operator: number;
  matchMode: number;
  value?: string | boolean | number;
  rangeValues?: {
    start: string;
    end: string;
  };
}

export interface SortRequest {
  field: string;
  direction: number;
  priority: number;
}

export interface QueryOptionsRequest {
  filtersRequest: FilterRequest[];
  sortRequest: SortRequest[];
  includes: string[];
}

export interface GetDepartmentsPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: any;
      rangeValues?: {
        start: string;
        end: string;
      };
    }>;
    sortRequest: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes: string[];
  };
}

export interface GetDepartmentsResponse {
  success: boolean;
  message: string;
  result: {
    data: Department[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}
export interface DropdownProps {
  id: string;
  name: string;
  label?: string;

  className?: string;

  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}


// src/utils/types.ts

export interface Benefit {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  type: string; // e.g., "HEALTH", "TRANSPORTATION"
  value: string; // e.g., "3000.00"
  valueType: string; // e.g., "FIXED", "PERCENTAGE"
  frequency: string; // e.g., "MONTHLY", "YEARLY"
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  sortOrder: number;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
  selected?: boolean;
}

export interface BenefitPayload {
  name: string;
  description: string;
  type: string;
  value: number | string;
  valueType: string;
  frequency: string;
  // startDate: string;
  // endDate: string;
  departmentId: string;
}

export interface GetBenefitsPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string | boolean | number;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetBenefitsResponse {
  success: boolean;
  message: string;
  result: {
    data: Benefit[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}

export interface DropdownOption {
  value: string;
  label: string;
}
// src/utils/types.ts
export interface EmployeePayload {
  user: {
    userName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    pictureUrl?: string;
    middleName?: string;
  };
  employeeCode: string;
  departmentId: string;
  designationId: string;
  shiftId: string;
  joiningDate: string;
  status: string;
  benefitId: string; // Single benefit ID as per payload
  benefits?: EmployeeBenefitInput[]; // New optional benefits array for API
  salary: number |string;

  phoneNumber: string;
  emergencyContact?: string;
  bankName: string; // New field for bank name
  ibanNumber: string; // New field for IBAN
  accountNumber: string;
  zkDeviceUserId?: string; // Biometric device's internal employee ID
}

export interface Employee {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  userId: string;
  employeeCode: string;
  
  departmentId: string;
  designationId: string;
  shiftId: string;
  joiningDate: string;
  salary: number | null;
  status: string;
  phoneNumber: string | null;
  benefitId: string;
  bankName?: string | null;
  ibanNumber?: string | null;
  accountNumber?: string | null;
  zkDeviceUserId?: string | null;
  user: {
    id: string;
    active: boolean;
    createdAt: string;
    createdBy: string;
    createdById: string;
    modifiedAt: string | null;
    modifiedBy: string | null;
    modifiedById: string | null;
    companyId: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    pictureUrl: string | null;
  };
  department: Department;
  designation: Designation;
  shift: Shift;
  benefit?: Benefit;
  selected?: boolean;
}

export interface Department {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string | null;
  createdById: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number | null;
  children: Department[];
  designations: string[];
  workingDays: {
    dayOfWeek: number;
    dayName: string;
    isWorkingDay: boolean;
    notes: string | null;
  }[];
  shifts: string[];
  benefits: string[];
  selected?: boolean;
}

export interface Designation {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  departmentId: string;
  title: string;
  code: string;
  jobDescription: string | null;
  levelHierarchy: string;
  responsibilities: string | null;
  sortOrder: number | null;
  department?: Department;
   selected?: boolean;
}

export interface Shift {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  breakDuration: number;
  order: number;
  departmentId: string;
  department?: { id: string; name: string; code: string; description: string | null; } | undefined;
  selected?: boolean;
}

export interface Benefit {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  name: string;
  code: string;
  description: string | null;
  type: string;
  value: string;
  valueType: string;
  frequency: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  departmentId: string | null;
  department?: { id: string; name: string; code: string; description: string | null; } | undefined;
  selected?: boolean;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface GetEmployeesPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string | boolean | number;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetEmployeesResponse {
  success: boolean;
  message: string;
  result: {
    data: Employee[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}
export interface Bank {
  id: string;
  name: string;
  logoUrl: string; // URL to bank logo
  bankCode: string; // 4-character bank code for IBAN
}

export interface EmployeeBenefitInput {
  benefitId: string;
  effectiveDate: string;
  endDate?: string;
  customValue?: number;
  notes?: string;
}

// Added: Designations API payload/response types
export interface GetDesignationsPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string | boolean | number;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetDesignationsResponse {
  success: boolean;
  message: string;
  result: {
    data: Designation[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}
// src/utils/types.ts
export interface DesignationPayload {
  title: string;
  departmentId: string;
}
export interface LeaveRequestPayload {
  fromDate: string;
  toDate: string;
  reason: string;
  typeId: string;
  requestType: string;
}




export interface Attendance {
  id: string;
  active?: boolean;
  createdAt?: string;
  createdBy?: string | null;
  createdById?: string | null;
  modifiedAt?: string | null;
  modifiedBy?: string | null;
  modifiedById?: string | null;
  companyId?: string;
  userId: string;
  employee: {
    id?: string;
    name: string;
    designation: string;
    profileUrl?: string | undefined;
  };
  department: {
    id: string;
    name: string;
  };
  status: "PRESENT" | "Absent" | "Late" | "ON_LEAVE" | "DAY_OFF";
 lockWorkingHours: number | null;
  isLate: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: number | null;
  shift: "Morning" | "Evening" | string;
  shiftId?: string;
  date: string;
  comment: string | null;
  selected?: boolean;
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  clockInTime: string;
}

export interface GetAttendancePayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string | boolean | number;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetAttendanceResponse {
  success: boolean;
  message: string;
  result: {
    data: any[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}

export interface CreateAttendancePayload {
  userId: string;
  date: string;
  status: "Present" | "Absent" | "Late";
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: string;
  shiftId?: string;
  comment?: string;
  departmentId?: string;
}

export interface UpdateAttendancePayload {
  id: string;
  status?: "Present" | "Absent" | "Late";
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: string;
  shiftId?: string;
  comment?: string;
  departmentId?: string;
}

export interface DeleteAttendancePayload {
  id: string;
}



// 10
export interface GetRequestsPayload {
  pagedListRequest: {
    pageNo: number;
    pageSize: number;
    getAllRecords: boolean;
  };
  queryOptionsRequest: {
    filtersRequest: Array<{
      field: string;
      operator: number;
      matchMode: number;
      value?: string | boolean | number;
      rangeValues?: { start: string; end: string };
    }>;
    sortRequest?: Array<{
      field: string;
      direction: number;
      priority: number;
    }>;
    includes?: string[];
  };
}

export interface GetRequestsResponse {
  success: boolean;
  message: string;
  result: {
    data: Request[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}

export interface Request {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  code: string;
  userId: string;
  attendanceId: string;
  type: "Check In" | "Check Out";
  date: string;
  time: string;
  reason: string;
  status: "APPROVED" | "PENDING" | "CANCELED";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  user?: {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    pictureUrl: string | null;
    employee?: {
      id: string;
      designation: {
        title: string;
      };
      department?: {
        id: string;
        name: string;
      };
    };
  };
}




// Common audit fields interface (reusable across entities)
export interface Auditable {
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
}

// Company interface (nested in the profile response)
export interface Company {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  name: string;
  phoneNo: string;
  email: string;
  address: string | null;
  temporaryAddress: string | null;
  zipCode: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  logoUrl: string | null;
}

// Role interface (nested in the profile response)
export interface Role {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  name: string;
  code: string;
  privileges: string[]; // Empty array in response, but typed as string[] for potential future use
}

export interface UserProfile {
  id: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  createdById: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
  modifiedById: string | null;
  companyId: string;
  company: Company;
  userName: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  pictureUrl: string | null; // This maps to profilePicture in components
  dateOfBirth: string | null;
  gender: string; // e.g., "other"
  status: number; // e.g., 1 for active
  lastLogin: string | null;
  lastOnline: string | null;
  roleId: string;
  isGoogleSignup: boolean;
  isEmailVerified: string | null; // Response uses string like "true" or "false"
  isPhoneVerified: string | null;
  phoneNumber: string | null;
  role: Role;
  employee: Employee;
}


export interface ProfileResponse {
  success: boolean;
  message: string;
  result: UserProfile;
}

// Export aliases for convenience (e.g., for Redux state)
// ProfileData type for globalSlice
export type ProfileData = UserProfile | null;
