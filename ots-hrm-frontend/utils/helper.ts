import { Leave, User } from "@/utils/types";


type FilterOptions = {
  leaveData?: Leave[];
  userData?: User[];
  dateRangeFilter: string;
  leaveTypeFilter?: string;
  roleFilter?: string;
  statusFilter?: string;
  sortOption: string;
};

export const handleFilterChange = (options: FilterOptions): Leave[] | User[] => {
  const {
    leaveData,
    userData,
    dateRangeFilter,
    leaveTypeFilter = "All",
    roleFilter = "All",
    statusFilter = "All",
    sortOption
  } = options;

  if (userData) {
    let filteredData = [...userData];

    if (statusFilter !== "All") {
      filteredData = filteredData.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== "All") {
      filteredData = filteredData.filter(user => user.role === roleFilter);
    }

    if (sortOption === "ascending") {
      filteredData.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "last7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredData = filteredData.filter(user => {
        const userDate = new Date(user.createdDate);
        return userDate >= sevenDaysAgo;
      });
    }

    return filteredData;
  }

  if (leaveData) {
    let filteredData = [...leaveData];

    if (dateRangeFilter === "Today") {
      const today = new Date().toLocaleDateString();
      filteredData = filteredData.filter(leave => leave.from === today);
    } else if (dateRangeFilter === "Yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString();
      filteredData = filteredData.filter(leave => leave.from === yesterdayStr);
    } else if (dateRangeFilter === "Last 7 days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredData = filteredData.filter(leave => {
        const leaveDate = new Date(leave.from);
        return leaveDate >= sevenDaysAgo;
      });
    }

    if (leaveTypeFilter !== "All") {
      filteredData = filteredData.filter(leave => leave.leaveType === leaveTypeFilter);
    }

    if (sortOption === "ascending") {
      filteredData.sort((a, b) => a.employee.localeCompare(b.employee));
    } else if (sortOption === "last7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredData = filteredData.filter(leave => {
        const leaveDate = new Date(leave.from);
        return leaveDate >= sevenDaysAgo;
      });
    }

    return filteredData;
  }

  return [];
};


export const convertTo12HourFormatFromDecimal = (decimalHours: string | number) => {
  const hoursDecimal = parseFloat(decimalHours as string);
  const hours = Math.floor(hoursDecimal);
  const minutes = Math.round((hoursDecimal - hours) * 60);

  const hourLabel = hours > 0 ? `${hours}h` : "";
  const minuteLabel = minutes > 0 ? `${minutes}m` : "";

  return hourLabel || minuteLabel ? `${hourLabel} ${minuteLabel}`.trim() : "0m";
};


export const convert24To12HourFormat = (timeString?: string | null, label?: "checkin" | "checkout"): string => {
  if (!timeString) {
    return label === "checkin" ? "Not Checked In" : "Not Checked Out";
  }

  const parts = timeString.split(":");
  if (parts.length < 2) return label === "checkin" ? "Not Checked In" : "Not Checked Out";

  const [hour, minute, second] = parts.map(Number);

  const date = new Date();
  date.setHours(hour);
  date.setMinutes(minute);
  date.setSeconds(second || 0);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export function capitalizeString(input: string) {
  if (!input || typeof input !== 'string') return '';

  return input
    .toLowerCase()
    .split(' ')
    .map(word =>
      word
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-')
    )
    .join(' ');
}
