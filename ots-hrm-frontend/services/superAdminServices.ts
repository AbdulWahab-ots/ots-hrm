import api, { axiosWithAuth } from "@/lib/api";
import { setDepartmentData } from "@/store/features/admin/department/departmentSlice";
import { setDesignationData } from "@/store/features/admin/designation/designationSlice";
import {
    setIsLoading,
    setProfileData,
} from "@/store/features/global/globalSlice";
import { AppDispatch } from "@/store/store";
import { AddUserPayload, GetInvitesPayload, GetInvitesResponse, UpdateAdminPayload } from "@/utils/company";
import { CreateCompanyPayload } from "@/utils/types";
import { GetCompaniesPayload, GetCompaniesResponse } from "@/utils/types";
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

// ============= Password  API ===========
export const changePasswordAPI = async (
  dispatch: AppDispatch,
  payload: {
    currentPassword: string;
    newPassword: string;
  }
) => {
  return apiHandler(dispatch, "post", "/user/change-password", {  // Changed from "put" to "post"
    data: payload,
    successMessage: "Password changed successfully",
      showSuccessToast: true,
    
  });
};
// src/services/companyService.ts

export const createCompanyAPI = async (
  dispatch: AppDispatch,
  payload: CreateCompanyPayload
) => {
  return apiHandler(dispatch, "post", "/company/add", {
    data: payload,
    successMessage: "Company created successfully",
    showSuccessToast: true,
  });
};
// src/services/companyService.ts


// export const getCompaniesAPI = async (
//   dispatch: AppDispatch,
//   payload: GetCompaniesPayload
// ) => {
//   return apiHandler<GetCompaniesResponse>(
//     dispatch,
//     "post",
//     "/company/get_all",
//     {
//       data: payload,
//       showSuccessToast: false, // We don't want to show toast for this
//     }
//   );
// };
export const getAllCompaniesAPI = async (
  dispatch: AppDispatch,
  payload: GetCompaniesPayload
): Promise<GetCompaniesResponse | null> => {
  return apiHandler<GetCompaniesResponse>(dispatch, "post", "/company/get_all", {
    data: payload,
    successMessage: "Companies fetched successfully",
    showSuccessToast: false,
  });
};





export const deleteCompanyAPI = async (
  dispatch: AppDispatch,
  companyId: string
): Promise<boolean> => {
  const response = await apiHandler(dispatch, "delete", `/company/delete/${companyId}`, {
    successMessage: "Company deleted successfully",
    showSuccessToast: true,
  });
  return !!response;
};
// company  update  api 
export const updateCompanyAPI = async (
  dispatch: AppDispatch,
  payload: {
    name: string;
    email: string;
  },
  companyId: string
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "put",
    `/company/update/${companyId}`,
    {
      data: payload,
      successMessage: "Company updated successfully",
      showSuccessToast: true,
    }
  );
  return !!response;
};


export const uploadCompanyLogoAPI = async (
  dispatch: AppDispatch,
  companyId: string,
  logo: File
): Promise<boolean> => {
  const formData = new FormData();
  formData.append("logo", logo);

  const response = await apiHandler(
    dispatch,
    "post",
    `/upload/company-logo?companyId=${companyId}`,
    {
      data: formData,
      isFormData: true,
      successMessage: "Company logo uploaded successfully",
      showSuccessToast: false,
    }
  );
  return !!response;
};



// User Update API
export const updateUserAPI = async (
    dispatch: AppDispatch,
    Id: string,
    payload: {
        firstName: string;
        lastName: string;
        email: string;
    }
): Promise<boolean> => {
    const response = await apiHandler(
        dispatch,
        "put",
        `/user/update/${Id}`,
        {
            data: payload,
            successMessage: "User profile updated successfully",
            showSuccessToast: true,
        }
    );
    return !!response;
};

// Profile Image Upload API Profile Image Upload API
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


//     Specific Company  admin   update add delete API

export const getAllCompanyAPI = async (
  dispatch: AppDispatch,
  payload: GetCompaniesPayload
): Promise<GetCompaniesResponse | null> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      "/company/get_all",
      { data: payload }
    );
    return response;
  } catch (error) {
    console.error("Error fetching companies:", error);
    return null;
  }
};

export const getAllInvitesAPI = async (
  dispatch: AppDispatch,
  payload: GetInvitesPayload
): Promise<GetInvitesResponse | null> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      "/invite/get_all",
      { data: payload }
    );
    return response;
  } catch (error) {
    console.error("Error fetching invites:", error);
    return null;
  }
};

export const addUserAPI = async (
  dispatch: AppDispatch,
  payload:AddUserPayload
): Promise<boolean> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      "/user/add",
      {
        data: payload,
        successMessage: "User(s) added successfully",
        showSuccessToast: true,
      }
    );
    return !!response;
  } catch (error) {
    console.error("Error adding user(s):", error);
    return false;
  }
};

export const updateAdminAPI = async (
  dispatch: AppDispatch,
  userId: string,
  payload: UpdateAdminPayload
): Promise<boolean> => {
  try {
    const response = await apiHandler(
      dispatch,
      "put",
      `/user/update/${userId}`,
      {
        data: payload,
        successMessage: "User updated successfully",
        showSuccessToast: true,
      }
    );
    return !!response;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
  }
};

export const inviteUserAPI = async (
  dispatch: AppDispatch,
  payload: {
    invites: {
      email: string;
      role: string;
      companyId: string;
    }[];
  }
): Promise<boolean> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      "/invite/add",
      {
        data: payload,
        successMessage: "User(s) invited successfully",
        showSuccessToast: true,
      }
    );
    return !!response;
  } catch (error) {
    console.error("Error inviting user(s):", error);
    return false;
  }
};

export const resendInviteAPI = async (
  dispatch: AppDispatch,
  inviteId: string,
  payload: { email: string }
): Promise<boolean> => {
  try {
    const response = await apiHandler(
      dispatch,
      "post",
      `/invite/resend/${inviteId}`,
      {
        data: payload,
        successMessage: "Invite resent successfully",
        showSuccessToast: true,
      }
    );
    return !!response;
  } catch (error) {
    console.error("Error resending invite:", error);
    return false;
  }
};

export const deleteUserAPI = async (
  dispatch: AppDispatch,
  userId: string
): Promise<boolean> => {
  try {
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
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

export const deleteInviteAPI = async (
  dispatch: AppDispatch,
  inviteId: string
): Promise<boolean> => {
  try {
    const response = await apiHandler(
      dispatch,
      "delete",
      `/invite/delete/${inviteId}`,
      {
        successMessage: "Invite deleted successfully",
        showSuccessToast: true,
      }
    );
    return !!response;
  } catch (error) {
    console.error("Error deleting invite:", error);
    return false;
  }
};