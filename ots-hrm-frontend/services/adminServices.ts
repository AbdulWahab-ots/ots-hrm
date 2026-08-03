import api, { axiosWithAuth } from "@/lib/api";
import { setCountryData, setCountryError, setCountryLoading } from "@/store/features/admin/countrySlice";
import { setDepartmentData } from "@/store/features/admin/department/departmentSlice";
// import { setDesignationData } from "@/store/features/admin/designation/designationSlice";
import { setLeaveTypeData, setLeaveTypeError, setLeaveTypeLoading } from "@/store/features/admin/leaveTypeSlice";
import {
  setIsLoading,
  setProfileData,
} from "@/store/features/global/globalSlice";
import {

  GetAttendancePayload,
  GetAttendanceResponse,
  GetRequestsPayload,
  ProfileResponse,

} from "@/utils/types";
import { AppDispatch } from "@/store/store";
import { BenefitPayload, Employee, EmployeePayload, GetBenefitsPayload, GetBenefitsResponse, GetCountriesResponse, GetDepartmentsPayload, GetDepartmentsResponse, GetEmployeesPayload, GetEmployeesResponse, GetHolidaysPayload, GetHolidaysResponse, GetLeaveTypesPayload, GetLeaveTypesResponse, GetShiftsPayload, GetShiftsResponse, GetDesignationsPayload, GetDesignationsResponse, HolidayPayload, LeaveTypePayload, ShiftPayload, DesignationPayload } from "@/utils/types";
import { toast } from "sonner";
import {
  setShiftData,
  setLoading as setShiftLoading,
  setError as setShiftError,
} from "@/store/features/admin/Shift/shiftSlice";
import {
  setBenefitData,
  setLoading as setBenefitLoading,
  setError as setBenefitError,
} from "@/store/features/admin/Benefit/benefitSlice";
import {
  setDesignationData,
  setLoading as setDesignationLoading,
  setError as setDesignationError,
} from "@/store/features/admin/designation/designationSlice";
import { setAttendanceData, setError, setLoading } from "@/store/features/employee/attendance/attendanceSlice";
import { setAttendanceRequestData, setAttendanceRequestError } from "@/store/features/admin/attendanceRequestSlice";


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
export const apiHandler = async <T = any>(
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
        toast.success(response?.data?.message || successMessage);
      }

      if (onSuccess && response.data) {
        onSuccess(response.data);
      }

      return response.data || null;
    }

    return null;
  } catch (error: any) {
    // Handle 404 differently in some cases
    if (error?.response?.status === 404) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      }

      if (onError) {
        onError(error);
      }
    } else if (error?.response?.status === 409) {
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      }

      if (onError) {
        onError(error);
      }
    } else {
      // Handle other errors
      toast.error(error?.response?.data?.message || error?.message || errorMessage);
      if (onError) {
        onError(error);
      }
    }

    return null;
  } finally {
    dispatch(setIsLoading(false));
  }
};

// ============= Fetch profile API ===========

// Fetch profile api
// export const fetchProfile = async (dispatch: AppDispatch) => {
//     return  apiHandler(dispatch, 'get', '/auth/profile', {
//         onSuccess: (data) => {
//             dispatch(setProfileData(data));
//         }
//     });
// };
export const fetchProfile = async (dispatch: AppDispatch) => {
  return apiHandler<ProfileResponse>(dispatch, "get", "/auth/profile", {
    onSuccess: (data) => {
      dispatch(setProfileData(data));
    },
  });
};
// ============= Department APIs =============

// Add new department
export const addNewDepartment = async (dispatch: AppDispatch, name: string) => {
  return apiHandler(dispatch, "post", "/department/add", {
    data: { name },
    showSuccessToast: true,
  });
};

// Fetch all departments
export const getAllDepartments = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, "post", "/department/get_all", {
    data: {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 100,
        getAllRecords: true,
      },
    },
    onSuccess: (data) => {
      dispatch(setDepartmentData(data));
    },
  });
};

// Get designations by department ID
export const getDesignationsByDepartmentId = async (dispatch: AppDispatch, departmentId: string) => {
  return apiHandler(dispatch, 'get', `/department/get_by_id/${departmentId}/designations`, {});
};

// Designation Services
// export const addNewDesignation = async (dispatch: AppDispatch, payload: any) => {
//     return apiHandler(dispatch, "post", "/designation/add", {
//         data: payload,
//         showSuccessToast: true,
//     });
// };

// src/services/adminServices.ts
export const createDesignationAPI = async (
  dispatch: AppDispatch,
  payload: DesignationPayload
): Promise<boolean> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      "/designation/add",
      {
        data: payload,
        successMessage: "Designation created successfully",
        showSuccessToast: true,
      }
    );
    return response;
  } catch (error) {

    return false;
  }
};
// Fetch all designations
// export const getAllDesignation = async (dispatch: AppDispatch) => {
//     return apiHandler(dispatch, "post", "/designation/get_all", {
//         data: {
//             pagedListRequest: {
//                 pageNo: 1,
//                 pageSize: 10,
//                 getAllRecords: false
//             },
//             queryOptionsRequest: {
//                 includes: ["department"]
//             }
//         },
//         onSuccess: (data) => {
//             dispatch(setDesignationData(data));
//         },
//     });
// };

// Update a single designation by Id
export const updateDesignation = async (dispatch: AppDispatch, payload: any) => {
  return apiHandler(dispatch, "put", `/designation/update/${payload.id}`, {
    data: payload,
    showSuccessToast: true,
  });
};

// Delete a single designation by Id
export const deleteDesignation = async (dispatch: AppDispatch, id: string) => {
  return apiHandler(dispatch, "delete", `/designation/delete/${id}`, {
    showSuccessToast: true,
  });
};

// Fetch any Designation by Id
export const fetchDesignationById = async (dispatch: AppDispatch, id: string) => {
  return apiHandler(dispatch, 'get', `/designation/get_by_id/${id}`, {});
}

// ============= ROLEs APIs =============

// Add new role
export const addNewRole = async (dispatch: AppDispatch, data: any) => {
  return apiHandler(dispatch, 'post', '/role/add', {
    data,
    showSuccessToast: true,
  })
}

// Fetch all roles
export const fetchAllRoles = async (dispatch: AppDispatch, data?: any) => {
  return apiHandler(dispatch, 'post', '/role/get_all', {
    data: {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 1,
        getAllRecords: true
      }
    },
  })
}

// Fetch any role by Id
export const fetchRoleById = async (dispatch: AppDispatch, id: string) => {
  return apiHandler(dispatch, 'get', `/role/get_by_id/${id}`, {});
}

// Update any role by Id
export const updateRoleById = async (dispatch: AppDispatch, data: any) => {
  return apiHandler(dispatch, 'put', `/role/update/${data.role_id}`, {
    data: {
      name: data.name,
      active: data.active,
    },
    showSuccessToast: true,
  });
}

// Delete any role by Id
export const deleteRoleById = async (dispatch: AppDispatch, id: any) => {
  return apiHandler(dispatch, 'delete', `/role/delete/${id}`, {
    showSuccessToast: true,
  });
}





// Fetch Employee Stats api
export const fetchEmployeeStats = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, 'get', '/employee/stats', {});
};

// ============= Check-In/Out Reminders =============

// Today's pending check-in/out reminders for the company.
export const getCheckInOutReminders = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, 'get', '/attendance/reminders', {});
};

// Deliver reminder notifications; pass userIds to target specific rows, omit for all.
export const sendCheckInOutReminders = async (
  dispatch: AppDispatch,
  userIds?: string[]
) => {
  return apiHandler(dispatch, 'post', '/attendance/reminders/send', {
    data: userIds && userIds.length ? { userIds } : {},
    showSuccessToast: true,
    successMessage: "Reminders sent",
  });
};

// Fetch Attendance Stats api
export const fetcAttendanceStats = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, 'post', '/attendance/stats', {
    data: {
      pagedListRequest: {
        getAllRecords: true
      },
      queryOptionsRequest: {
        filtersRequest: [
          {
            field: "date",
            operator: 10,
            matchMode: 1,
            rangeValues: {
              start: "2025-06-16",
              end: "2025-06-16"
            }
          }
        ]
      }
    }
  });
};

// Fetch all Attendance api
// export const fetchAllAttendance = async (dispatch: AppDispatch) => {
//     const currentDate = new Date().toISOString().split("T")[0];
//     return apiHandler(dispatch, 'post', '/attendance/get_all', {
//         data: {
//             queryOptionsRequest: {
//                 employee: true,
//                 filtersRequest: [
//                     {
//                         field: "date",
//                         operator: 1,
//                         matchMode: 10,
//                         rangeValues: {
//                             start: currentDate,
//                             end: currentDate
//                         }
//                     }
//                     // {
//                     //     "field": "userId",
//                     //     "operator": 1,
//                     //     "matchMode": 1,
//                     //     "value": "96ffa9b4-9a77-4419-899a-3b972f0b9bf3"
//                     // }
//                     // {
//                     //     "field": "status",
//                     //     "operator": 1,
//                     //     "matchMode": 1,
//                     //     "value": "Present"
//                     // }
//                 ],
//                 sortRequest: [
//                     {
//                         field: "date",
//                         direction: 1,
//                         priority: 1
//                     }
//                 ],
//                 includes: [
//                     "user",
//                     "user.employee"
//                 ]
//             }
//         }
//     });
// };


// Fetch All Emloyee leaves api
export const fetcAllEmployeesLeaves = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, 'post', '/leave-type/get_all', {
    data: {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 1,
        getAllRecords: true
      }
    }
  });
};


export const fetchLeaveTypeById = async (dispatch: AppDispatch, id: string) => {
  return apiHandler(dispatch, 'get', `/leave-type/get_by_id/${id}`, {});
}

// Update any leave Type by Id
export const updateLeaveType = async (dispatch: AppDispatch, data: any, id: string | string[]) => {
  return apiHandler(dispatch, 'put', `/leave-type/update/${id}`, {
    data,
    showSuccessToast: true,
  });
}

// Delete any Leave Type by Id
export const deleteLeaveType = async (dispatch: AppDispatch, id: any) => {
  // return apiHandler(dispatch, 'delete', `/role/delete/${id}`, {
  //     showSuccessToast: true,
  // });
}


export const getAllDepartmentAPI = async (
  dispatch: AppDispatch,
  payload: GetDepartmentsPayload
): Promise<GetDepartmentsResponse | null> => {
  return apiHandler<GetDepartmentsResponse>(dispatch, "post", "/department/get_all", {
    data: payload,
    successMessage: "Departments fetched successfully",
    showSuccessToast: false,
  });
};

export const deleteDepartmentAPI = async (
  dispatch: AppDispatch,
  departmentId: string
): Promise<boolean> => {

  await apiHandler(dispatch, "delete", `/department/delete/${departmentId}`, {
    successMessage: "Department deleted successfully",
  });
  return true;

};

export const updateDepartmentAPI = async (
  dispatch: AppDispatch,
  payload: {
    name: string;
    code: string;
    description: string;
    workingDays: { dayName: string; isWorkingDay: boolean }[];
  },
  departmentId: string
): Promise<boolean> => {

  const response = await apiHandler(dispatch, "put", `department/update/${departmentId}`, {
    data: payload,
    successMessage: "Company updated successfully",
    showSuccessToast: true,
  }
  );
  return !!response;
};

export const createDepartmentAPI = async (
  dispatch: AppDispatch,
  payload: {
    name: string;
    code: string;
    description: string;
    workingDays: { dayName: string; isWorkingDay: boolean }[];
  }
): Promise<boolean> => {
  try {
    await apiHandler(dispatch, "post", "/department/add", {
      data: payload,
      successMessage: "Department created successfully",
    });
    return true;
  } catch (error) {
    console.error("Failed to create department:", error);
    return false;
  }
};


//      Leave type api  
export const getAllLeaveTypesAPI = async (
  dispatch: AppDispatch,
  payload: GetLeaveTypesPayload
): Promise<GetLeaveTypesResponse | null> => {
  return apiHandler<GetLeaveTypesResponse>(
    dispatch,
    "post",
    "/leave-type/get_all",
    {
      data: payload,
      successMessage: "Leave types fetched successfully",
      showSuccessToast: false,
    }
  );
};

export const deleteLeaveTypeAPI = async (
  dispatch: AppDispatch,
  leaveTypeId: string
): Promise<boolean> => {
  await apiHandler(dispatch, "delete", `/leave-type/delete/${leaveTypeId}`, {
    successMessage: "Leave type deleted successfully",
  });
  return true;
};
//        edit Leave  api 
export const updateLeaveTypeAPI = async (
  dispatch: AppDispatch,
  payload: LeaveTypePayload,
  leaveTypeId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "put",
    `/leave-type/update/${leaveTypeId}`,
    {
      data: payload,
      successMessage: "Leave type updated successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};



//        Create  Leave  api 

export const createLeaveTypeAPI = async (
  dispatch: AppDispatch,
  payload: LeaveTypePayload
): Promise<boolean> => {
  try {
    await apiHandler(dispatch, "post", "/leave-type/add", {
      data: payload,
      successMessage: "Leave type created successfully",
    });
    return true;
  } catch (error) {
    return false;
  }
};



// src/services/companyService.ts

// Add User API (Single or Multiple Users)
export const addUserAPI = async (
  dispatch: AppDispatch,
  payload: {
    users?: {
      userName: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      companyId: string;
      roleId?: string;
    }[];
    userName?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    roleId?: string;
  }
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "post",
    "/user/add",
    {
      data: payload.users ? { users: payload.users } : payload,
      successMessage: "User(s) added successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};

// Create a single login user (role = 'admin' | 'employee'; companyId taken from token).
// Uses /user/create which validates the payload and maps the role to a roleId.
export const createUserAPI = async (
  dispatch: AppDispatch,
  payload: {
    userName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }
) => {
  // Route is /user/add (CommonRoutes.create === 'add'); mapped to the validated
  // createUsers handler that maps role → roleId and hashes the password.
  return apiHandler(dispatch, "post", "/user/add", {
    data: payload,
    successMessage: "User created successfully",
    showSuccessToast: true,
  });
};

// Paged list of company users (includes their role).
export const getAllUsersAPI = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, "post", "/user/get_all", {
    data: {
      pagedListRequest: { getAllRecords: true },
      queryOptionsRequest: {
        filtersRequest: [],
        sortRequest: [{ field: "createdAt", direction: -1, priority: 1 }],
        includes: ["role"],
      },
    },
  });
};

// ============= Announcements =============

// Company announcements, newest first. Readable by any authenticated user
// (admins manage them; employees view them).
export const getAllAnnouncementsAPI = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, "post", "/announcement/get_all", {
    data: {
      pagedListRequest: { getAllRecords: true },
      queryOptionsRequest: {
        filtersRequest: [],
        sortRequest: [{ field: "createdAt", direction: -1, priority: 1 }],
      },
    },
  });
};

// Create an announcement (admin only); backend fans out notifications to employees.
export const createAnnouncementAPI = async (
  dispatch: AppDispatch,
  payload: { title: string; description: string }
) => {
  return apiHandler(dispatch, "post", "/announcement/add", {
    data: payload,
    successMessage: "Announcement posted",
    showSuccessToast: true,
  });
};

// Delete an announcement (admin only).
export const deleteAnnouncementAPI = async (
  dispatch: AppDispatch,
  id: string
): Promise<boolean> => {
  const res = await apiHandler(dispatch, "delete", `/announcement/delete/${id}`, {
    successMessage: "Announcement deleted",
    showSuccessToast: true,
  });
  return !!res;
};

// Invite User API (Single or Multiple Invites)
export const inviteUserAPI = async (
  dispatch: AppDispatch,
  payload: {
    invites?: {
      email: string;
      role: string;

    }[];
    email?: string;
    role?: string;

  }
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "post",
    "/invite/add",
    {
      data: payload.invites ? { invites: payload.invites } : payload,
      successMessage: "User(s) invited successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};

// Delete User API
export const deleteUserAPI = async (
  dispatch: AppDispatch,
  userId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "delete",
    `/user/delete/${userId}`,
    {
      successMessage: "User deleted successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};




// Holiday APIs
export const getAllHolidaysAPI = async (
  dispatch: AppDispatch,
  payload: GetHolidaysPayload
): Promise<GetHolidaysResponse | null> => {
  return apiHandler<GetHolidaysResponse>(
    dispatch,
    "post",
    "/public-holiday/get_all",
    {
      data: payload,
      successMessage: "Holidays fetched successfully",
      showSuccessToast: false,
    }
  );
};

export const deleteHolidayAPI = async (
  dispatch: AppDispatch,
  holidayId: string
): Promise<boolean> => {
  await apiHandler(
    dispatch,
    "delete",
    `/public-holiday/delete/${holidayId}`,
    {
      successMessage: "Holiday deleted successfully",
      showSuccessToast: true,
    }
  );
  return true;
};

export const updateHolidayAPI = async (
  dispatch: AppDispatch,
  payload: HolidayPayload,
  holidayId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "put",
    `/public-holiday/update/${holidayId}`,
    {
      data: payload,
      successMessage: "Holiday updated successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};

export const createHolidayAPI = async (
  dispatch: AppDispatch,
  payload: HolidayPayload
): Promise<boolean> => {
  try {
    await apiHandler(
      dispatch,
      "post",
      "/public-holiday/add",
      {
        data: payload,
        successMessage: "Holiday created successfully",
      }
    );
    return true;
  } catch (error) {

    return false;
  }
};

// Country APIs
export const fetchAllCountries = async (dispatch: AppDispatch) => {
  try {
    dispatch(setCountryLoading(true));
    return apiHandler<GetCountriesResponse>(
      dispatch,
      "post",
      "/country/get_all",
      {
        data: {
          pagedListRequest: {

            "getAllRecords": true
          },
          queryOptionsRequest: {
            filtersRequest: [],
            sortRequest: [
              {
                field: "name",
                direction: 0,
                priority: 1,
              },
            ],
          },
        },
        onSuccess: (data) => {
          dispatch(setCountryData(data));
        },
      }
    );
  } catch (error: any) {
    console.error("Countries API error:", error);
    dispatch(setCountryError(error?.response?.data?.message || "Failed to fetch countries"));
    throw error;
  } finally {
    dispatch(setCountryLoading(false));
  }
};


export const fetchAllLeaveTypes = async (dispatch: AppDispatch) => {
  try {
    dispatch(setLeaveTypeLoading(true));
    return apiHandler(
      dispatch,
      "post",
      "/leave-type/get_all",
      {
        data: {
          pagedListRequest: {
            pageNo: 1,
            pageSize: 100,
            getAllRecords: true,
          },
        },
        onSuccess: (data) => {
          dispatch(setLeaveTypeData(data.result.data));
        },
      }
    );
  } catch (error: any) {
    dispatch(setLeaveTypeError(error?.response?.data?.message || "Failed to fetch leave types"));
    throw error;
  } finally {
    dispatch(setLeaveTypeLoading(false));
  }
};


export const getAllShiftsAPI = async (
  dispatch: AppDispatch,
  payload: GetShiftsPayload
): Promise<GetShiftsResponse | null> => {
  return apiHandler<GetShiftsResponse>(
    dispatch,
    "post",
    "/shift/get_all",
    {
      data: payload,
      successMessage: "Shifts fetched successfully",
      showSuccessToast: false,
    }
  );
};

export const deleteShiftAPI = async (
  dispatch: AppDispatch,
  shiftId: string
): Promise<boolean> => {
  await apiHandler(
    dispatch,
    "delete",
    `/shift/delete/${shiftId}`,
    {
      successMessage: "Shift deleted successfully",
    }
  );
  return true;
};

export const updateShiftAPI = async (
  dispatch: AppDispatch,
  payload: ShiftPayload,
  shiftId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "put",
    `/shift/update/${shiftId}`,
    {
      data: payload,
      successMessage: "Shift updated successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};

export const createShiftAPI = async (
  dispatch: AppDispatch,
  payload: ShiftPayload
): Promise<boolean> => {
  try {
    await apiHandler(
      dispatch,
      "post",
      "/shift/add",
      {
        data: payload,
        successMessage: "Shift created successfully",
      }
    );
    return true;
  } catch (error) {
    console.error("Failed to create shift:", error);
    return false;
  }
};

export const fetchAllDepartments = async (dispatch: AppDispatch) => {
  try {
    return apiHandler<GetDepartmentsResponse>(
      dispatch,
      "post",
      "/department/get_all",
      {
        data: {
          pagedListRequest: {
            getAllRecords: true,
          },
          queryOptionsRequest: {
            filtersRequest: [],
            sortRequest: [
              {
                field: "name",
                direction: 0,
                priority: 1,
              },
            ],
          },
        },
        onSuccess: (data) => {
          dispatch(setDepartmentData(data.result.data));
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch departments:", error);
    throw error;
  }
};



// src/services/adminServices.ts

// Fetch all benefits
export const getAllBenefitsAPI = async (
  dispatch: AppDispatch,
  payload: GetBenefitsPayload
): Promise<GetBenefitsResponse | null> => {
  return apiHandler<GetBenefitsResponse>(
    dispatch,
    "post",
    "/benefit/get_all",
    {
      data: payload,
      successMessage: "Benefits fetched successfully",
      showSuccessToast: false,
    }
  );
};

// Create a benefit
export const createBenefitAPI = async (
  dispatch: AppDispatch,
  payload: BenefitPayload
): Promise<boolean> => {
  try {
    await apiHandler(
      dispatch,
      "post",
      "/benefit/add",
      {
        data: payload,
        successMessage: "Benefit created successfully",
        showSuccessToast: true,
      }
    );
    return true;
  } catch (error) {
    console.error("Failed to create benefit:", error);
    return false;
  }
};

// Update a benefit
export const updateBenefitAPI = async (
  dispatch: AppDispatch,
  payload: BenefitPayload,
  benefitId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "put",
    `/benefit/update/${benefitId}`,
    {
      data: payload,
      successMessage: "Benefit updated successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};

// Delete a benefit
export const deleteBenefitAPI = async (
  dispatch: AppDispatch,
  benefitId: string
): Promise<boolean> => {
  await apiHandler(
    dispatch,
    "delete",
    `/benefit/delete/${benefitId}`,
    {
      successMessage: "Benefit deleted successfully",
      showSuccessToast: true,
    }
  );
  return true;
};

//    empolyee 

export const fetchAllDesignations = async (dispatch: AppDispatch) => {
  dispatch(setDesignationLoading(true));
  try {
    const payload: GetDesignationsPayload = {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 100,
        getAllRecords: true,
      },
      queryOptionsRequest: {
        filtersRequest: [],
        sortRequest: [{ field: "createdAt", direction: 1, priority: 1 }],
        includes: ["department"],
      },
    };
    const response = await apiHandler<GetDesignationsResponse>(
      dispatch,
      "post",
      "/designation/get_all",
      {
        data: payload,
        successMessage: "Fetched all designations successfully",
        showSuccessToast: false,
      }
    );
    if (response?.success && response.result?.data) {

      dispatch(setDesignationData(response.result.data));
    } else {

      dispatch(setDesignationError("Failed to fetch designations"));
    }
    return response;
  } catch (error: any) {

    dispatch(setDesignationError(error?.response?.data?.message || "Failed to fetch designations"));
    return null;
  } finally {
    dispatch(setDesignationLoading(false));
  }
};

export const fetchAllShifts = async (dispatch: AppDispatch) => {
  dispatch(setShiftLoading(true));
  try {
    const payload: GetShiftsPayload = {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 100,
        getAllRecords: true,
      },
      queryOptionsRequest: {
        filtersRequest: [],
        sortRequest: [{ field: "createdAt", direction: -1, priority: 1 }],
        includes: ["department"],
      },
    };
    const response = await apiHandler<GetShiftsResponse>(
      dispatch,
      "post",
      "/shift/get_all",
      {
        data: payload,
        successMessage: "Fetched all shifts successfully",
        showSuccessToast: false,
      }
    );
    if (response?.success && response.result?.data) {

      dispatch(setShiftData(response.result.data));
    } else {

      dispatch(setShiftError("Failed to fetch shifts"));
    }
    return response;
  } catch (error: any) {

    dispatch(setShiftError(error?.response?.data?.message || "Failed to fetch shifts"));
    return null;
  } finally {
    dispatch(setShiftLoading(false));
  }
};

export const fetchAllBenefits = async (dispatch: AppDispatch) => {
  dispatch(setBenefitLoading(true));
  try {
    const payload: GetBenefitsPayload = {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 100,
        getAllRecords: true,
      },
      queryOptionsRequest: {
        filtersRequest: [],
        sortRequest: [{ field: "createdAt", direction: -1, priority: 1 }],
        includes: ["department"],
      },
    };
    const response = await apiHandler<GetBenefitsResponse>(
      dispatch,
      "post",
      "/benefit/get_all",
      {
        data: payload,
        successMessage: "Fetched all benefits successfully",
        showSuccessToast: false,
      }
    );
    if (response?.success && response.result?.data) {
      dispatch(setBenefitData(response.result.data));
    } else {

      dispatch(setBenefitError("Failed to fetch benefits"));
    }
    return response;
  } catch (error: any) {

    dispatch(setBenefitError(error?.response?.data?.message || "Failed to fetch benefits"));
    return null;
  } finally {
    dispatch(setBenefitLoading(false));
  }
};

export const getAllEmployeesAPI = async (
  dispatch: AppDispatch,
  payload: GetEmployeesPayload
): Promise<GetEmployeesResponse | null> => {
  return apiHandler<GetEmployeesResponse>(
    dispatch,
    "post",
    "/employee/get_all",
    {
      data: payload,
      successMessage: "Employees fetched successfully",
      showSuccessToast: false,
    }
  );
};

export const getEmployeeByIdAPI = async (
  dispatch: AppDispatch,
  employeeId: string
): Promise<{ result: Employee } | null> => {
  return apiHandler<{ result: Employee }>(
    dispatch,
    "get",
    `/employee/get_by_id/${employeeId}`,
    {
      successMessage: "Employee fetched successfully",
      showSuccessToast: false,
    }
  );
};

// Triggers a fresh "Set Your Password" email for an existing employee — the only
// admin-facing way to help an employee get a new password (passwords are bcrypt-hashed
// and never recoverable/displayable).
export const sendSetPasswordEmailAPI = async (
  dispatch: AppDispatch,
  employeeId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "post",
    `/employee/${employeeId}/send-set-password-email`,
    {
      successMessage: "Set-password email sent successfully!",
    }
  );
  return !!response;
};

export const createEmployeeAPI = async (
  dispatch: AppDispatch,
  payload: EmployeePayload
): Promise<any> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      "/employee/add",
      {
        data: payload,
        successMessage: "Employee created successfully",
        showSuccessToast: true,
      }
    );
    return response;
  } catch (error) {
    return null;
  }
};

export const updateEmployeeAPI = async (
  dispatch: AppDispatch,
  payload: EmployeePayload,
  employeeId: string
): Promise<any> => {
  // Remove fields not supported by backend Employee update to avoid errors (e.g., benefits)
  const { benefits, ...sanitizedPayload } = (payload as any) || {};

  const response = await apiHandler(
    dispatch,
    "put",
    `/employee/update/${employeeId}`,
    {
      data: sanitizedPayload,
      successMessage: "Employee updated successfully",
      showSuccessToast: true,
    }
  );
  return response;
};

export const deleteEmployeeAPI = async (
  dispatch: AppDispatch,
  employeeId: string
): Promise<boolean> => {
  await apiHandler(
    dispatch,
    "delete",
    `/employee/delete/${employeeId}`,
    {
      successMessage: "Employee deleted successfully",
      showSuccessToast: true,
    }
  );
  return true;
};

// Deactivates an employee who has attendance/leave/payroll history instead of hard-deleting
// them (which the backend blocks with a 409 for exactly that reason).
export const resignEmployeeAPI = async (
  dispatch: AppDispatch,
  employeeId: string,
  payload: { status: string; effectiveDate: string }
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "post",
    `/employee/${employeeId}/resign`,
    {
      data: payload,
      successMessage: "Employee status updated successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};

//  Profile upload image 
export const uploadProfileImageAPI = async (
  dispatch: AppDispatch,
  Id: string,
  profileImage: File
): Promise<boolean> => {
  const formData = new FormData();
  formData.append("profilePicture", profileImage);

  const response = await apiHandler(
    dispatch,
    "post",
    `/upload/profile-picture/${Id}`,
    {
      data: formData,
      isFormData: true,
      successMessage: "Profile image uploaded successfully",
      // showSuccessToast: true,
    }
  );
  return !!response;
};


export const getCompanyStats = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, 'get', '/company/statistics', {
    onSuccess: (data) => {
      dispatch(setProfileData(data));
    }
  });
};

// src/services/adminServices.ts


export const fetchAllAttendance = async (
  dispatch: AppDispatch,
  payload: GetAttendancePayload
): Promise<GetAttendanceResponse | null> => {
  dispatch(setLoading(true));
  try {
    const response = await apiHandler<GetAttendanceResponse>(
      dispatch,
      "post",
      "/attendance/get_all",
      {
        data: payload,
        successMessage: "Fetched all attendance records successfully",
        showSuccessToast: false,
        onSuccess: (data) => {
          if (data?.success && data.result?.data) {
            dispatch(setAttendanceData(data.result.data));
          } else {
            dispatch(setError("Failed to fetch attendance records"));
          }
        },
        onError: (error) => {
          dispatch(setError("Failed to fetch attendance records"));
        },
      }
    );
    return response;
  } catch (error: any) {
    console.error("Failed to fetch attendance:", error);
    dispatch(setError(error?.response?.data?.message || "Failed to fetch attendance records"));
    return null;
  } finally {
    dispatch(setLoading(false));
  }
};

// Admin: refresh a specific employee's attendance from the biometric device (today by
// default). Saves the fetched record into our own Attendance table server-side.
export const refreshEmployeeAttendanceAPI = async (
  dispatch: AppDispatch,
  employeeId: string,
  date?: string
): Promise<any> => {
  return apiHandler(dispatch, "post", "/attendance/biometric-sync", {
    data: { employeeId, ...(date ? { date } : {}) },
  });
};


export const fetchAllRequests = async (
  dispatch: AppDispatch,
  payload: GetRequestsPayload
) => {
  return apiHandler(
    dispatch,
    "post",
    "/request/get_all",
    {
      data: payload,
      successMessage: "Requests fetched successfully",
      showSuccessToast: false,
    }
  );
};


//  Attendance   Action 

export const approveRequest = async (
  dispatch: AppDispatch,
  requestId: string,
  reviewNotes: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiHandler(
      dispatch,
      "put",
      `/request/approve/${requestId}`,
      {
        data: { reviewNotes },
        successMessage: "Request approved successfully",
        showSuccessToast: true,
      }
    );
    return { success: !!response };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || "Failed to approve request";
    console.error("Failed to approve request:", error);
    return { success: false, error: errorMessage };
  }
};

export const rejectRequest = async (
  dispatch: AppDispatch,
  requestId: string,
  reviewNotes: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiHandler(
      dispatch,
      "put",
      `/request/reject/${requestId}`,
      {
        data: { reviewNotes },
        successMessage: "Request rejected successfully",
        showSuccessToast: true,
      }
    );
    return { success: !!response };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || "Failed to reject request";
    console.error("Failed to reject request:", error);
    return { success: false, error: errorMessage };
  }
};



//   Voaction  Action 

export const approveVocationRequest = async (
  dispatch: AppDispatch,
  requestId: string,
  data: { status: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiHandler(
      dispatch,
      "put",
      `/vacation/update/status/${requestId}`,
      {
        data: data,
        successMessage: "Request approved successfully",
        showSuccessToast: true,
      }
    );
    return { success: !!response };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || "Failed to approve request";
    console.error("Failed to approve request:", error);
    return { success: false, error: errorMessage };
  }
};

export const rejectVocationRequest = async (
  dispatch: AppDispatch,
  requestId: string,
  data: { status: string; rejectionReason: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiHandler(
      dispatch,
      "put",
      `/vacation/update/status/${requestId}`,
      {
        data: data,
        successMessage: "Request rejected successfully",
        showSuccessToast: true,
      }
    );
    return { success: !!response };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || "Failed to reject request";
    console.error("Failed to reject request:", error);
    return { success: false, error: errorMessage };
  }
};



export const getAllDesignationAPI = async (
  dispatch: AppDispatch,
  payload: GetDepartmentsPayload // Reusing the same payload structure for consistency
): Promise<GetDesignationsResponse | null> => {
  return apiHandler<GetDesignationsResponse>(
    dispatch,
    "post",
    "/designation/get_all",
    {
      data: payload,
      successMessage: "Designations fetched successfully",
      showSuccessToast: false,
    }
  );
};


export const updateDesignationAPI = async (
  dispatch: AppDispatch,
  payload: DesignationPayload,
  id: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "put",
    `/designation/update/${id}`,
    {
      data: payload,
      successMessage: "Designation updated successfully",
    }
  );
  return !!response;
};

export const deleteDesignationAPI = async (
  dispatch: AppDispatch,
  id: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "delete",
    `/designation/delete/${id}`,
    {
      successMessage: "Designation deleted successfully",
    }
  );
  return !!response;
};