"use client";

import { useEffect, useRef, useState } from "react";
import NotificationButton from "./NotificationButton";
import { formatTimeAgo } from "@/utils/formatTimeAgo";
import {
  fetchAllNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
} from "@/services/notificationService";

interface NotificationDropdownProps {
  dispatch: any;
  className?: string;
}

const extractList = (response: any): NotificationItem[] =>
  response?.result?.data ?? response?.result ?? response?.data ?? [];

const extractUnreadCount = (response: any): number =>
  response?.result?.count ??
  response?.result?.unreadCount ??
  response?.result ??
  response?.count ??
  0;

const NotificationDropdown = ({
  dispatch,
  className,
}: NotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = async () => {
    const response = await fetchUnreadNotificationCount(dispatch);
    setUnreadCount(extractUnreadCount(response));
  };

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setIsLoading(true);
      const response = await fetchAllNotifications(dispatch);
      setNotifications(extractList(response));
      setIsLoading(false);
    }
  };

  const handleSelectNotification = async (notification: NotificationItem) => {
    if (notification.isRead) return;
    const response = await markNotificationAsRead(dispatch, notification.id);
    if (!response) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    const response = await markAllNotificationsAsRead(dispatch);
    if (!response) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <NotificationButton
        className={className}
        hasUnread={unreadCount > 0}
        onClick={handleToggle}
      />

      {isOpen && (
        <div className="absolute right-0 top-16 z-50 w-[320px] sm:w-[384px] bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-menu">
          <div className="flex items-center justify-between px-4 py-3 border-b border-g-gray-alpha-400">
            <h3 className="text-label-14 font-semibold text-g-gray-1000">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-label-14 text-g-blue-700 hover:underline focus-ring-geist"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-label-14 text-g-gray-700">
                Loading notifications...
              </p>
            ) : notifications.length > 0 ? (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    onClick={() => handleSelectNotification(notification)}
                    className="px-4 py-3 border-b border-g-gray-alpha-400 last:border-b-0 hover:bg-g-gray-alpha-100 cursor-pointer flex items-start gap-2"
                  >
                    {!notification.isRead && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-g-blue-700 shrink-0" />
                    )}
                    <div className={notification.isRead ? "pl-3.5" : ""}>
                      {notification.title && (
                        <p className="text-label-14 font-medium text-g-gray-1000">
                          {notification.title}
                        </p>
                      )}
                      <p className="text-label-14 text-g-gray-800">
                        {notification.message}
                      </p>
                      <p className="text-label-12 text-g-gray-700 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-label-14 text-g-gray-700">
                No notifications yet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
