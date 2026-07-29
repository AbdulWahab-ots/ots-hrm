import { LucideIcon } from "lucide-react";

export interface DefaultAdmin {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface InvitedUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
  status: string; // e.g., "PENDING", "ACCEPTED"
  createdAt?: string;
  expiresAt?: string;
  acceptedAt?: string | null;
  selected?: boolean; // Added for row selection
}

export interface Users {
  id: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  selected?: boolean;
  active?: boolean; // Added for status column
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

export interface FilterRequest {
  field: string;
  operator: number;
  matchMode: number;
  value?: string; // Made optional to support rangeValues
  rangeValues?: { start: string; end: string };
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

export interface GetInvitesPayload {
  pagedListRequest: PagedListRequest;
  queryOptionsRequest: QueryOptionsRequest;
}

export interface GetCompaniesResponse {
  result: {
    data: { id: string; name: string; users: Users[] }[];
    numberOfPages: number;
    total: number;
  };
}

export interface GetInvitesResponse {
  result: {
    data: InvitedUser[];
    numberOfPages: number;
    total: number;
  };
}

export interface TableMeta<T> {
  toggleRowSelection?: (id: string) => void;
  selectedRows?: T[];
  setIsBulkDelete?: (value: boolean) => void;
  setIsDeleteModalOpen?: (value: boolean) => void;
  setDepartmentToDelete?: (id: string) => void;
  handleEdit?: (item: T) => void;
  router?: any;
  refreshData?: () => void;
  toastError?: (message: string) => void;
}

export interface AddUserPayload {
  users: {
    userName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyId: string;
  }[];
}

export interface UpdateAdminPayload {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  roleId?: string;
}

export interface DeleteUserPayload {
  userId: string;
}

export interface Employee {
  id: string;
  userName: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  pictureUrl?: string | null;
}

export interface VocationDepartment {
  id: string;
  name: string;
}

export interface LeaveType {
  id: string;
  name: string;
  department: VocationDepartment;
}

export interface Vocation {
  id: string;
  createdById: string;
  name: string;
  requestedByUser: Employee;
  department?: VocationDepartment;
  leaveType: LeaveType;
  fromDate: string | null;
  toDate: string | null;
  status: "APPROVED" | "PENDING" | "REJECTED";
  reason: string | null;
  createdAt: string;
  actionAt: string | null;
  totalDays: number;
}

export interface GetVacationsPayload {
  pagedListRequest: PagedListRequest;
  queryOptionsRequest: QueryOptionsRequest;
}

export interface GetVacationsResponse {
  success: boolean;
  message: string;
  result: {
    data: Vocation[];
    total: number;
    pageStartsFrom: number;
    pageEndsAt: number;
    numberOfPages: number;
  };
}