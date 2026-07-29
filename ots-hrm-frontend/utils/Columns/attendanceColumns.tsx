import { ColumnDef } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import ToggleButton from "@/components/common/form/ToggleButton";
export interface Employee {
  id?: string;
  name: string;
  designation: string;
  profileUrl?: string;
}

export interface Department {
  id: string;
  name: string;
}
export interface Attendance {
  id: string;
  selected?: boolean;
  employee: Employee;
  department: Department;
  status: "Present" | "Absent" | "Late";
  isLate: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalHours: string | null;
  shift: "Morning" | "Evening";
  date: string;
  comment: string | null;
}
export const attendanceColumns: ColumnDef<Attendance, any>[] = [
  {
    id: "selection",
    header: "",
    cell: (info: any) => {
      const attendance = info.row.original as Attendance;
      return (
        <CustomCheckbox
          checked={attendance.selected || false}
          onChange={() =>
            info.table.options.meta?.toggleRowSelection?.(attendance.id)
          }
          id={`checkbox-${attendance.id}`}
        />
      );
    },
    size: 40,
  },
  {
    accessorKey: "employee",
    header: "Employee",
    cell: (info: any) => {
      const attendance = info.row.original as Attendance;
      return (
        <div className="flex items-center space-x-3">
          <img
            src={"https://placehold.co/600x400/png"}
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-900">
              {attendance.employee.name}
            </div>
            <div className="text-sm text-gray-500">
              {attendance.employee.designation}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: (info: any) => {
      const attendance = info.row.original as Attendance;
      return (
        <div className="text-gray-500">
          {attendance.department.name || "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info: any) => {
      const status = info.getValue();
      const colorClass =
        status === "Present"
          ? "text-g-green-800 bg-g-green-100"
          : status === "Absent"
          ? "text-g-red-800 bg-g-red-100"
          : "text-g-amber-900 bg-g-amber-100";
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "isLate",
    header: "Late",
    cell: (info: any) => {
      const isLate = info.getValue();
      return <div className="text-gray-500">{isLate ? "Yes" : "No"}</div>;
    },
  },
  {
    accessorKey: "checkInTime",
    header: "Check-in",
    cell: (info: any) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    accessorKey: "checkOutTime",
    header: "Check-out",
    cell: (info: any) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    accessorKey: "totalHours",
    header: "Total Hours",
    cell: (info: any) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    accessorKey: "shift",
    header: "Shift",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: (info: any) => {
      const date = info.getValue();
      return (
        <div className="text-gray-500">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "comment",
    header: "Comment",
    cell: (info: any) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
];
