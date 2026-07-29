import api, { axiosWithAuth } from "@/lib/api";
import { setDepartmentData } from "@/store/features/admin/department/departmentSlice";
import { setDesignationData } from "@/store/features/admin/designation/designationSlice";
import { setAttendanceData } from "@/store/features/employee/attendance/attendanceSlice";
import {
  setIsLoading,
  setProfileData,
} from "@/store/features/global/globalSlice";
import { AppDispatch } from "@/store/store";
import { GetVacationsPayload, GetVacationsResponse } from "@/utils/company";
import { GetRequestsPayload, LeaveRequestPayload } from "@/utils/types";

import { toast } from "sonner";

// Types
type ApiMethod = "get" | "post" | "put" | "delete";
type ApiResponse<T = any> = {
  data?: T & { success?: boolean };
  status?: number;
};
type ErrorResponse = {
  message?: string;
  status?: number;
  response?: { data?: { detail?: string } };
};

// Generic API handler that centralizes common logic
export const apiHandler = async <T = any,>(
  dispatch: AppDispatch,
  method: ApiMethod,
  endpoint: string,
  options: {
    data?: any;
    params?: Record<string, string | number | boolean | undefined>;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: T) => void;
    onError?: (error: ErrorResponse) => void;
    isFormData?: boolean;
    showSuccessToast?: boolean; // New parameter to control success toast
  }
): Promise<T | null> => {
  const {
    data,
    params,
    successMessage,
    errorMessage = "Something went wrong",
    onSuccess,
    onError,
    isFormData = false,
    showSuccessToast = false,
  } = options;

  try {
    dispatch(setIsLoading(true));

    // Build URL with query parameters if needed
    let url = endpoint;
    if (params) {
      const queryParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    }

    // Configure request
    const config: any = {};
    if (isFormData) {
      config.headers = { "Content-Type": "multipart/form-data" };
    }

    // Make API call
    let response: ApiResponse<T>;

    switch (method) {
      case "get":
        response = await axiosWithAuth.get(url, config);
        break;
      case "post":
        response = await axiosWithAuth.post(url, data, config);
        break;
      case "put":
        response = await axiosWithAuth.put(url, data, config);
        break;
      case "delete":
        response = await axiosWithAuth.delete(url, config);
        break;
    }

    // Handle success
    if (
      response?.status === 200 ||
      response?.data?.success ||
      response?.status === 201
    ) {
      // Show success toast only if explicitly requested
      if (showSuccessToast) {
        // @ts-ignore
        toast.success((response as any)?.data?.message || successMessage);
      }

      if (onSuccess && response.data) {
        onSuccess(response.data);
      }

      return response.data || null;
    }

    return null;
  } catch (error: any) {
    // Normalize Axios error
    const axiosStatus = error?.response?.status ?? error?.status;
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      errorMessage;

    // Show backend message (avoid showing stack dumps)
    if (backendMessage) {
      toast.error(backendMessage);
    } else {
      toast.error(errorMessage);
    }

    if (onError) {
      onError({
        message: backendMessage,
        status: axiosStatus,
        response: error?.response,
      });
    }

    return null;
  } finally {
    dispatch(setIsLoading(false));
  }
};
// ============= Fetch Attendance serivces ===========

// Fetched Attendance Status
export const fetchAttendanceStatus = async (dispatch: AppDispatch) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const currentDate = `${year}-${month}-${day}`;
  return apiHandler(dispatch, "get", `/attendance/status`, {
    params: { date: currentDate },
  });
};

// Check-in api
export const checkIn = async (dispatch: AppDispatch, data: any) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const currentDate = `${year}-${month}-${day}`;
  return apiHandler(dispatch, "post", "/attendance/check-in", {
    data: data,
    showSuccessToast: true,
    onSuccess: async () => {
      await fetchEmployeeAttendance(dispatch, currentDate, currentDate);
    },
  });
};

// Check-out api
export const checkOut = async (dispatch: AppDispatch, data: any) => {
  const currentDate = new Date().toISOString().split("T")[0];

  return apiHandler(dispatch, "post", "/attendance/check-out", {
    data: data,
    showSuccessToast: true,
    onSuccess: async () => {
      await fetchEmployeeAttendance(dispatch, currentDate, currentDate);
    },
  });
};

// Fetch Employee Attendance api
export const fetchEmployeeAttendance = async (
  dispatch: AppDispatch,
  startDate?: string,
  endDate?: string
) => {
  const currentDate = new Date().toISOString().split("T")[0];
  const start = startDate || currentDate;
  const end = endDate || currentDate;

  return apiHandler(dispatch, "post", "/attendance/get_all", {
    data: {
      queryOptionsRequest: {
        employee: true,
        filtersRequest: [
          {
            field: "date",
            operator: 1,
            matchMode: 10,
            rangeValues: {
              start: start,
              end: end,
            },
          },
          // {
          //     "field": "userId",
          //     "operator": 1,
          //     "matchMode": 1,
          //     "value": "96ffa9b4-9a77-4419-899a-3b972f0b9bf3"
          // }
          // {
          //     "field": "status",
          //     "operator": 1,
          //     "matchMode": 1,
          //     "value": "Present"
          // }
        ],
        sortRequest: [
          {
            field: "date",
            direction: 1,
            priority: 1,
          },
        ],
        includes: ["user", "user.employee"],
      },
    },
    onSuccess: (data) => {
      dispatch(setAttendanceData(data.result.data));
    },
  });
};

/**
 * Fetch attendance rows for a date range WITHOUT writing to the shared
 * `state.attendance` slice (the Calendar tab reads that slice for the page's
 * selected month). Same endpoint / filter / auth as fetchEmployeeAttendance —
 * this variant just returns the rows so a component (e.g. the heatmap) can hold
 * its own range in local state and navigate history independently.
 */
export const fetchAttendanceRange = async (
  dispatch: AppDispatch,
  startDate: string,
  endDate: string
) => {
  return apiHandler(dispatch, "post", "/attendance/get_all", {
    data: {
      queryOptionsRequest: {
        employee: true,
        filtersRequest: [
          {
            field: "date",
            operator: 1,
            matchMode: 10,
            rangeValues: { start: startDate, end: endDate },
          },
        ],
        sortRequest: [{ field: "date", direction: 1, priority: 1 }],
        includes: ["user", "user.employee"],
      },
    },
  });
};

// Add new Vacation
export const addNewVacation = async (dispatch: AppDispatch, data: any) => {
  return apiHandler(dispatch, "post", "/vacation/add", {
    data,
    showSuccessToast: true,
  });
};

// Fetch all Vacation
export const fetchAllVacation = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, "post", "/vacation/get_all", {
    data: {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 1,
        getAllRecords: true,
      },
      queryOptionsRequest: {
        filtersRequest: [
          // {
          //     "field": "status",
          //     "operator": 1,
          //     "matchMode": 1,
          //     "value": "Approved"
          // }
        ],
        sortRequest: [
          {
            field: "createdAt",
            direction: 1,
            priority: 1,
          },
        ],
        includes: ["leaveType", "company"],
      },
    },
  });
};

// Fetch any vacation by Id
export const fetchVacationById = async (
  dispatch: AppDispatch,
  id?: string | string[]
) => {
  return apiHandler(dispatch, "get", `/vacation/get_by_id/${id}`, {});
};

// Update any vacation by Id
export const updateVacation = async (
  dispatch: AppDispatch,
  data: any,
  id: string | string[]
) => {
  return apiHandler(dispatch, "put", `/vacation/update/${id}`, {
    data,
    showSuccessToast: true,
  });
};

export const createLeaveRequestAPI = async (
  dispatch: AppDispatch,
  payload: LeaveRequestPayload
): Promise<boolean> => {
  try {
    const response = await apiHandler(dispatch, "post", "/vacation/add", {
      data: payload,
      successMessage: "Leave request submitted successfully",
      showSuccessToast: true,
    });
    if (!response || (response as any)?.success === false) {
      console.warn("Leave request failed:", (response as any)?.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to create leave request:", error);
    return false;
  }
};

// In src/lib/api.ts or src/services/adminServices.ts

export const fetchAttendanceRecords = async (
  dispatch: AppDispatch,
  pageNo: number,
  pageSize: number,
  startDate: string,
  endDate: string,
  status?: string
): Promise<any> => {
  try {
    const payload = {
      pagedListRequest: {
        pageNo,
        pageSize,
        getAllRecords: false,
      },
      queryOptionsRequest: {
        filtersRequest: [
          {
            field: "date",
            operator: 1,
            matchMode: 10,
            rangeValues: {
              start: startDate,
              end: endDate,
            },
          },
          ...(status
            ? [
              {
                field: "status",
                operator: 1,
                matchMode: 1,
                value: status, // Use provided API status directly (e.g., PRESENT, HOLIDAY)
              },
            ]
            : []),
        ],
        sortRequest: [
          {
            field: "date",
            direction: 1,
            priority: 1,
          },
        ],
        includes: ["user", "user.employee"],
      },
    };

    return await apiHandler(dispatch, "post", "/attendance/get_all", {
      data: payload,
      successMessage: "Attendance records fetched successfully",
      showSuccessToast: false,
    });
  } catch (error: any) {
    console.error("Failed to fetch attendance records:", error);
    throw error;
  }
};
export interface AttendanceRequestPayload {
  type: "CHECK_IN" | "CHECK_OUT";
  date: string;
  time: string;
  reason: string;
}

// Create attendance request API
export const createAttendanceRequestAPI = async (
  dispatch: AppDispatch,
  payload: AttendanceRequestPayload
): Promise<boolean> => {
  try {
    const response = await apiHandler(dispatch, "post", "/request/add", {
      data: payload,
      successMessage: "Attendance request submitted successfully",
      showSuccessToast: true,
    });
    return !!response;
  } catch (error) {
    console.error("Failed to create attendance request:", error);
    return false;
  }
};

// Fetch attendance requests API

export const fetchAllEmployeeRequests = async (
  dispatch: AppDispatch,
  payload: GetRequestsPayload
) => {
  return apiHandler(dispatch, "post", "/request/get_all", {
    data: payload,
    successMessage: "Requests fetched successfully",
    showSuccessToast: false,
  });
};

export const getAllVacationsAPI = async (
  dispatch: AppDispatch,
  payload: GetVacationsPayload
): Promise<GetVacationsResponse | null> => {
  return apiHandler<GetVacationsResponse>(
    dispatch,
    "post",
    "/vacation/get_all",
    {
      data: payload,
      successMessage: "Vacations fetched successfully",
      showSuccessToast: false,
    }
  );
};
