// frontend/services/payrollService.ts
import { apiHandler } from "@/services/employeeService";
import { AppDispatch } from "@/store/store";

export type PayrollStatus =
  | "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";

export interface PayrollListParams {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  status?: PayrollStatus;
  payrollMonth?: number; // 1-12 (single-month equality filter)
  payrollYear?: number;
  payrollMonthStart?: number; // 1-12 — used together with payrollMonthEnd for a BETWEEN filter
  payrollMonthEnd?: number;   // 1-12
}

const eq = (field: string, value: string | number) => ({
  field, operator: 1, matchMode: 1, value,
});

const between = (field: string, start: number, end: number) => ({
  field, operator: 1, matchMode: 10, rangeValues: { start, end },
});

export const fetchPayrolls = (dispatch: AppDispatch, params: PayrollListParams = {}) => {
  const {
    page = 1, pageSize = 10, departmentId, status,
    payrollMonth, payrollYear,
    payrollMonthStart, payrollMonthEnd,
  } = params;
  const filtersRequest: any[] = [];
  if (departmentId) filtersRequest.push(eq("departmentId", departmentId));
  if (status) filtersRequest.push(eq("status", status));
  if (payrollYear) filtersRequest.push(eq("payrollYear", payrollYear));
  if (payrollMonthStart !== undefined && payrollMonthEnd !== undefined) {
    filtersRequest.push(between("payrollMonth", payrollMonthStart, payrollMonthEnd));
  } else if (payrollMonth) {
    filtersRequest.push(eq("payrollMonth", payrollMonth));
  }

  return apiHandler(dispatch, "post", "/payroll/get_all", {
    data: {
      pagedListRequest: { pageNo: page, pageSize, getAllRecords: false },
      queryOptionsRequest: {
        filtersRequest,
        sortRequest: [
          { field: "payrollYear", direction: 1, priority: 1 },
          { field: "payrollMonth", direction: 1, priority: 2 },
        ],
        includes: ["user", "employee", "employee.user", "department", "adjustments"],
      },
    },
  });
};

export const fetchPayrollById = (dispatch: AppDispatch, id: string) =>
  apiHandler(dispatch, "get", `/payroll/get_by_id/${id}`, {});

export const generateSalarySlips = (
  dispatch: AppDispatch,
  data: { departmentIds: string[]; payrollMonth: number; payrollYear: number; notes?: string }
) =>
  apiHandler(dispatch, "post", "/payroll/generate-salary-slips", {
    data, showSuccessToast: true, successMessage: "Salary slips generated",
  });

export const updatePayrollStatus = (
  dispatch: AppDispatch,
  data: { payrollId: string; status: PayrollStatus; notes?: string }
) =>
  apiHandler(dispatch, "post", "/payroll/status-update", {
    data, showSuccessToast: true, successMessage: "Payroll status updated",
  });

export const deletePayroll = (dispatch: AppDispatch, id: string) =>
  apiHandler(dispatch, "delete", `/payroll/delete/${id}`, {
    showSuccessToast: true, successMessage: "Payroll deleted",
  });

export const fetchAdjustments = (dispatch: AppDispatch, payrollId: string) =>
  apiHandler(dispatch, "get", `/payroll/adjustment/${payrollId}`, {});

export const addAdjustments = (dispatch: AppDispatch, payrollId: string, adjustments: any[]) =>
  apiHandler(dispatch, "post", `/payroll/adjustment/${payrollId}`, {
    data: { adjustments }, showSuccessToast: true,
  });

export const deleteAdjustment = (dispatch: AppDispatch, adjustmentId: string) =>
  apiHandler(dispatch, "delete", `/payroll/adjustment/${adjustmentId}`, {
    showSuccessToast: true,
  });
