import { toast } from "sonner";
import { FormikValues } from "formik";
import { AppDispatch, persistor } from "@/store/store";
import api from "@/lib/api";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { setUser } from "@/store/features/auth/authSlice";
import { SignUpFormValues, SignUpWithInvitePayload } from "@/utils/types";

// Types
type ApiMethod = 'get' | 'post' | 'put' | 'delete';
type ApiResponse<T = any> = {
    data?: T & { success?: boolean; message?: string };
    status?: number;
};
type ErrorResponse = {
    message?: string;
    status?: number;
    response?: { data?: { detail?: string } };
};

// Generic API handler that centralizes common logic
const apiHandler = async <T = any>(
    dispatch: AppDispatch,
    method: ApiMethod,
    endpoint: string,
    options: {
        data?: any;
        params?: Record<string, string | undefined>;
        successMessage?: string;
        errorMessage?: string;
        onSuccess?: (data: T) => void;
        onError?: (error: ErrorResponse) => void;
        isFormData?: boolean;
        headers?: Record<string, string>;
    }
): Promise<T | null> => {
    const {
        data,
        params,
        successMessage = "Operation successful", // Default success message
        errorMessage = "Something went wrong", // Default error message
        onSuccess,
        onError,
        isFormData = false,
    } = options;
    try {
        dispatch(setIsLoading(true));

        // Build URL with query parameters if needed
        let url = endpoint;
        if (params) {
            const queryParams = Object.entries(params)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
                .join('&');
            url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
        }

        // Configure request
        const config: any = {
            headers: {
                ...(isFormData ? { "Content-Type": "multipart/form-data" } : {}),
                ...(options.headers || {})
            }
        };

        // Make API call
        let response: ApiResponse<T>;
        switch (method) {
            case 'get':
                response = await api.get(url, config);
                break;
            case 'post':
                response = await api.post(url, data, config);
                break;
            case 'put':
                response = await api.put(url, data, config);
                break;
            case 'delete':
                response = await api.delete(url, config);
                break;
        }

        // Handle success
        if (response?.status === 200 || response?.data?.success || response?.status === 201) {
            toast.success(response?.data?.message || successMessage);
            if (onSuccess && response.data) {
                onSuccess(response.data);
            }
            return response.data || null;
        }

        return null;
    } catch (error: any) {
        // Handle 404 differently in some cases
        if (error?.status === 404) {
            if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            }

            if (onError) {
                onError(error);
            }
        } if (error?.status === 409) {
            if (error?.response?.data?.message) {
                toast.error(error.response.data.message);
            }
            if (onError) {
                onError(error);
            }
        }
        if (error?.status === 401 ) {
         if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
    }
    if (onError) {
        onError(error);
    }
        }
                if (error?.status === 400) {
            if (error?.response?.data?.message) {
                toast.error("Sign-in failed. Please check your credentials.");
            }
            if (onError) {
                onError(error);
            }
        }
        
        else {
                    // Handle other errors
                    
                    if (error?.status !== 401) {
                        toast.error(error?.message || errorMessage);
                    }
            if (onError) {
                onError(error);
            }
        }
        return null;
    } finally {
        dispatch(setIsLoading(false));
    }
};

// ============= Auth Screens & Logout =============

export const handleSignUp = async (dispatch: AppDispatch, values?: SignUpFormValues) => {
    return apiHandler(dispatch, 'post', '/auth/signup', {
        data: values,
        successMessage: "User has signed up successfully!",
        onSuccess: (data) => {
            dispatch(setUser(data));
        },
        onError: () => dispatch(setUser(null))
    });
};

export const handleVerifyCode = async (dispatch: AppDispatch, values?: any) => {
    return apiHandler(dispatch, 'get', '/auth/verify', {
        params: values,
        onSuccess: (data) => {
            dispatch(setUser(data));
        },
        onError: () => dispatch(setUser(null))
    });
};

export const handleSignIn = async (dispatch: AppDispatch, values?: FormikValues) => {
    return apiHandler(dispatch, 'post', '/auth/login', {
        data: values,
        onSuccess: (data) => {
            localStorage.setItem("user", JSON.stringify(data));
            // The middleware only reads result.role.code for route gating. Storing the
            // whole login object overflowed the ~4KB cookie limit (and its commas
            // truncated the value), so the cookie was silently dropped and protected
            // routes bounced to /sign-in. Persist just the role — the full object stays
            // in localStorage for the API client (token + company-id).
            const roleCookie = JSON.stringify({
                result: { role: { code: data?.result?.role?.code ?? "" } },
            });
            document.cookie = `user=${roleCookie}; path=/`;
            dispatch(setUser(data));
        },
        onError: () => dispatch(setUser(null))
    });
};

export const logoutAPI = async (dispatch: AppDispatch) => {
    const result = await apiHandler(dispatch, 'get', '/auth/logout', {});
    // Clear auth state regardless of the request outcome - apiHandler swallows
    // errors, so a failed/offline logout must not leave the user signed in
    // (the user cookie alone keeps the route middleware treating them as logged in).
    dispatch(setUser(null));
    localStorage.clear();
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    await persistor.purge();
    return result;
};

export const handleForgotPassword = async (dispatch: AppDispatch, email: string) => {
    return apiHandler(dispatch, 'get', '/auth/forgot-password', {
        params: { email },
        successMessage: "Password reset link sent successfully!",
        onSuccess: (data) => {
            localStorage.setItem("resetEmail", email);
            dispatch(setUser(data));
        },
        onError: () => {
            localStorage.removeItem("resetEmail");
            dispatch(setUser(null));
        }
    });
};

export const handleResetPassword = async (dispatch: AppDispatch, payload: any) => {
    return apiHandler(dispatch, 'post', '/auth/reset-password', {
        data: payload,
        successMessage: "Reset Password successfully!",
        onSuccess: (data) => {
            dispatch(setUser(data));
            localStorage.removeItem("resetEmail");
            localStorage.removeItem("verifiedCode");
        },
        onError: () => {
            dispatch(setUser(null));
        }
    });
};

export const handleResendCode = async (dispatch: AppDispatch, email: string, whichPurpose: string) => {
    return apiHandler(dispatch, 'get', '/auth/resend-code', {
        params: { email, whichPurpose },
        successMessage: "Verification code resent successfully!",
        onSuccess: (data) => {
            dispatch(setUser(data));
        },
        onError: () => {
            dispatch(setUser(null));
        }
    });
};

// SignUp with Invite API
export const signUpWithInvite = async (
  dispatch: AppDispatch,
  payload: SignUpWithInvitePayload
): Promise<boolean> => {
  const response = await apiHandler(
    dispatch,
    "post",
    "/auth/signup-with-invite",
    {
      data: payload,
      successMessage: "Account created successfully",
    //   showSuccessToast: true,
    }
  );
  return !!response;
};