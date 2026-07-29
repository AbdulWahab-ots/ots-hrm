import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosWithAuth: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
 
const clearSessionAndRedirect = () => {
  localStorage.clear();
  document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  if (!window.location.pathname.startsWith("/sign-in")) {
    window.location.href = "/sign-in";
  }
};

// Attach token and company-id
axiosWithAuth.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // @ts-ignore
    const userString = localStorage?.getItem("user");
    if (!userString) {
      clearSessionAndRedirect();
      return Promise.reject(new Error("Unauthorized: No user data found"));
    }

    try {
      const user = JSON.parse(userString);
      const token = user?.access_token;
      const companyId = user?.result?.companyId;

      if (!token) {
        clearSessionAndRedirect();
        return Promise.reject(new Error("Unauthorized: No token found"));
      }

      config.headers.Authorization = `Bearer ${token}`;

      // Add company-id to headers if it exists
      if (companyId) {
        config.headers['company-id'] = companyId;
      }

      return config;
    } catch (error) {
      clearSessionAndRedirect();
      return Promise.reject(new Error("Error parsing user data"));
    }
  },
  (error: any) => Promise.reject(error)
);

// Catch 401 and log out
axiosWithAuth.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    if (error.response?.status === 401) {
      clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);
 
export default api;