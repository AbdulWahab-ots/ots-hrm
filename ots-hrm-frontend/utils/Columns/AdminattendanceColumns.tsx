import { ColumnDef } from "@tanstack/react-table";
import { Attendance } from "@/utils/types";
import { IoCheckmarkSharp } from "react-icons/io5"; // For PRESENT
import { SlCup } from "react-icons/sl"; // For ON_LEAVE
import { RxCross2 } from "react-icons/rx"; // For Absent
import { HiOutlineExclamationCircle } from "react-icons/hi"; // For Late
import { FiCoffee, FiCalendar } from "react-icons/fi"; // FiCalendar for DAY_OFF
import { RefreshCw } from "lucide-react";
import { classifyWorkedHours } from "@/utils/attendanceHours";

interface AdminAttendanceTableMeta {
  handleRefreshAttendance?: (attendance: Attendance) => void;
}

export const AdminattendanceColumns: ColumnDef<Attendance>[] = [
  {
    accessorKey: "employee",
    header: "Employee",
    cell: ({ row }) => {
      const employee = row.original.employee;
      const firstLetter = employee?.name?.charAt(0)?.toUpperCase() || "";

      return (
        <div className="flex items-center gap-3">
          {employee?.profileUrl ? (
            <img
              src={employee.profileUrl}
              alt={employee.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 flex-nowrap flex items-center justify-center rounded-full bg-[#C7B9DA] text-gray-700 font-semibold">
              {firstLetter}
            </div>
          )}
          <div className="text-nowrap">
            <div className="font-medium text-sm text-g-gray-1000">
              {employee.name}
            </div>
            <div className="text-sm text-g-gray-900 font-normal">
              {employee.designation}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "department.name",
    header: "Department",
    cell: ({ row }) => {
      const department = row.original.department;

      return (
        <span className="inline-block text-nowrap bg-g-gray-100 pt-[2px] pr-[8px] pb-[2px] pl-[6px] rounded-[var(--g-radius-full)] text-xs font-medium text-g-gray-900 text-center">
          {department.name}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const statusStyles: Record<string, string> = {
        Late: "text-g-amber-900 bg-g-amber-100",
        PRESENT: "text-g-green-800 bg-g-green-100",
        Absent: "text-g-red-800 bg-g-red-100",
        ON_LEAVE: "text-g-gray-900 bg-g-gray-100",
        // A scheduled day off is not an unexcused absence — a distinct blue keeps it
        // from reading as a negative/red status like Absent.
        DAY_OFF: "text-g-blue-800 bg-g-blue-100",
      };
      const Icon = {
        PRESENT: IoCheckmarkSharp,
        ON_LEAVE: FiCoffee,
        Absent: RxCross2,
        Late: HiOutlineExclamationCircle,
        DAY_OFF: FiCalendar,
      }[status];
      const statusLabel = status === "DAY_OFF" ? "Day Off" : status;

      return (
        <span
          className={`inline-flex items-center gap-1 pt-[2px] pr-[8px] pb-[2px] pl-[6px] rounded-[var(--g-radius-full)] text-sm text-center ${statusStyles[status] || "text-g-gray-900 bg-g-gray-100"
            }`}
        >
          {Icon && <Icon className="w-4 h-4 mb-0.5 font-bold" />}
          {statusLabel}
        </span>
      );
    },
  },
  {
    accessorKey: "checkInTime",
    header: "Check-In",
    cell: ({ row }) => (
      <span className="text-g-gray-800 text-sm font-normal">
        {row.original.checkInTime || "--:--"}
      </span>
    ),
  },
  {
    accessorKey: "checkOutTime",
    header: "Check-Out",
    cell: ({ row }) => (
      <span className="text-g-gray-800 text-sm font-normal">
        {row.original.checkOutTime || "--:--"}
      </span>
    ),
  },
  {
    accessorKey: "lockWorkingHours",
    header: "Total Hours",
    cell: ({ row }) => {
      const totalHours = row.original.lockWorkingHours;
      if (!totalHours)
        return (
          <span className="text-g-gray-800 text-sm font-normal">--:--</span>
        );
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      const classification = classifyWorkedHours(totalHours, row.original.totalHours);
      const classificationStyles: Record<string, string> = {
        overtime: "text-g-amber-900",
        undertime: "text-g-red-800",
        on_time: "text-g-green-800",
      };
      return (
        <div className="flex flex-col">
          <span className="text-g-gray-800 text-sm font-normal">
            {hours}h {minutes}m
          </span>
          {classification.kind !== "none" && (
            <span className={`text-xs font-medium ${classificationStyles[classification.kind]}`}>
              {classification.label}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "shift",
    header: "Shift",
    cell: ({ row }) => (
      <span className="text-g-gray-800 text-sm font-normal">
        {row.original.shift}
      </span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.original.date);
      return (
        <span className="text-g-gray-800 text-nowrap text-sm font-normal">
          {date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      );
    },
  },
  // {
  //   accessorKey: "comment",
  //   header: "Comment",
  //   cell: ({ row }) => (
  //     <span className="text-g-gray-800 text-sm font-normal">
  //       {row.original.comment}
  //     </span>
  //   ),
  // },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as AdminAttendanceTableMeta | undefined;
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            meta?.handleRefreshAttendance?.(row.original);
          }}
          title="Refresh Attendance"
          className="text-g-gray-700 cursor-pointer hover:text-g-blue-700"
        >
          <RefreshCw size={16} />
        </button>
      );
    },
  },
];
