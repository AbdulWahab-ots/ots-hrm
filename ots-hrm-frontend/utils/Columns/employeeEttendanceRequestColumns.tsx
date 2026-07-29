// utils/Columns/employeeEttendanceRequestColumns.tsx
import { ColumnDef } from "@tanstack/react-table";

export interface EmployeeRecord {
  id: string;
  selected?: boolean;
  employeeName: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "Present" | "Holiday" | "Leave" | "Absent" | "Pending";
  date: string;
  reason: string | null;
}

// Status colors matching the calendar styling
const statusColors = {
  Present: {
    bg: "var(--g-green-100)",
    text: "var(--g-green-800)",
    border: "var(--g-green-300)",
  },
  Holiday: {
    bg: "var(--g-gray-100)",
    text: "var(--g-gray-900)",
    border: "var(--g-gray-300)",
  },
  Leave: {
    bg: "var(--g-blue-100)",
    text: "var(--g-blue-800)",
    border: "var(--g-blue-300)",
  },
  Absent: {
    bg: "var(--g-red-100)",
    text: "var(--g-red-800)",
    border: "var(--g-red-300)",
  },
  Pending: {
    bg: "var(--g-amber-100)",
    text: "var(--g-amber-900)",
    border: "var(--g-amber-300)",
  },
};

// Helper function to format time to 12-hour with AM/PM (e.g., "6:15 PM")
const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return "--";
  try {
    // Try parsing as 24-hour time first (e.g., "18:15:00")
    let date: Date;
    if (timeStr.includes(":")) {
      const parts = timeStr.split(":");
      if (parts.length >= 2) {
        // Assume HH:MM:SS or HH:MM
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        date = new Date();
        date.setHours(hours, minutes, 0, 0);
      } else {
        throw new Error("Invalid time format");
      }
    } else {
      // Fallback: treat as timestamp or direct Date
      date = new Date(timeStr);
    }
    // Format to 12-hour with leading zero for single-digit hours (e.g., "06:15 PM")
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.warn("Invalid time format:", timeStr);
    return timeStr; // Fallback to original if parsing fails
  }
};

// Helper function to format date to MM/DD/YYYY (e.g., "03/15/2025")
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
    // Format to MM/DD/YYYY with leading zeros
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Invalid date format:", dateStr);
    return dateStr; // Fallback to original if parsing fails
  }
};

export const employeeEttendanceRequestColumns: ColumnDef<
  EmployeeRecord,
  any
>[] = [
  {
    accessorKey: "checkIn",
    header: "Check In",
    cell: (info: any) => {
      const v = formatTime(info.getValue());
      return (
        <div className={v === "--" ? "text-g-gray-600" : "text-g-gray-900"}>{v}</div>
      );
    },
  },
  {
    accessorKey: "checkOut",
    header: "Check Out",
    cell: (info: any) => {
      const v = formatTime(info.getValue());
      return (
        <div className={v === "--" ? "text-g-gray-600" : "text-g-gray-900"}>{v}</div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info: any) => {
      const status = info.getValue();
      const colorConfig = statusColors[status as keyof typeof statusColors] || {
        bg: "var(--g-gray-100)",
        text: "var(--g-gray-900)",
        border: "var(--g-gray-300)",
      };

      return (
        <span
          className="px-2.5 py-1 rounded-full text-label-12 font-medium inline-flex items-center whitespace-nowrap"
          style={{
            backgroundColor: colorConfig.bg,
            color: colorConfig.text,
            border: `1px solid ${colorConfig.border}`,
          }}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: (info: any) => {
      const v = formatDate(info.getValue());
      return (
        <div className={v === "--" ? "text-g-gray-600" : "text-g-gray-900"}>{v}</div>
      );
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: (info: any) => {
      const v = info.getValue();
      return (
        <div className={`max-w-[16rem] truncate ${v ? "text-g-gray-900" : "text-g-gray-600"}`}>
          {v || "--"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const record = info.row.original;
      return (
        <div className="flex gap-2">
          {record.checkIn === null && (
            <button
              onClick={() => info.meta?.onRequest?.("CHECK_IN", record.date)}
              title="Request Check In"
              className="text-blue-500 hover:text-blue-700"
            >
              {/* Replace with actual icon component */}
              Check In Icon
            </button>
          )}
          {record.checkOut === null && (
            <button
              onClick={() => info.meta?.onRequest?.("CHECK_OUT", record.date)}
              title="Request Check Out"
              className="text-blue-500 hover:text-blue-700"
            >
              {/* Replace with actual icon component */}
              Check Out Icon
            </button>
          )}
        </div>
      );
    },
  },
];
