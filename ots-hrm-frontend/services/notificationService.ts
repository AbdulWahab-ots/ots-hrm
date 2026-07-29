import { apiHandler } from "@/services/employeeService";
import { AppDispatch } from "@/store/store";

export interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

// Fetch paginated notifications for the current user
export const fetchAllNotifications = async (
  dispatch: AppDispatch,
  pageNo = 1,
  pageSize = 10
) => {
  return apiHandler(dispatch, "post", "/notification/get_all", {
    data: {
      pagedListRequest: {
        pageNo,
        pageSize,
        getAllRecords: false,
      },
      queryOptionsRequest: {
        filtersRequest: [],
        sortRequest: [
          {
            field: "createdAt",
            direction: 1,
            priority: 1,
          },
        ],
      },
    },
    errorMessage: "Failed to load notifications",
    showSuccessToast: false,
  });
};

// Fetch the current user's unread notification count
export const fetchUnreadNotificationCount = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, "get", "/notification/unread-count", {
    errorMessage: "Failed to load unread notification count",
    showSuccessToast: false,
  });
};

// Mark a single notification as read
export const markNotificationAsRead = async (
  dispatch: AppDispatch,
  id: string
) => {
  return apiHandler(dispatch, "post", `/notification/mark-read/${id}`, {
    errorMessage: "Failed to mark notification as read",
    showSuccessToast: false,
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (dispatch: AppDispatch) => {
  return apiHandler(dispatch, "post", "/notification/mark-all-read", {
    errorMessage: "Failed to mark notifications as read",
    showSuccessToast: false,
  });
};
