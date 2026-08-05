import { ColumnDef } from "@tanstack/react-table";
import { FiEye } from "react-icons/fi";
import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Attendance } from "../../components/admin/requests/RequestsTable";
import { BUSINESS_TIMEZONE } from "@/utils/timezone";

export const RequestColumns = (
  handleOpenDetailsModal: (attendance: Attendance) => void,
  showCheckbox: boolean = true
): ColumnDef<Attendance, any>[] => [
    ...(showCheckbox
      ? [
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
      ]
      : []),
    {
      accessorKey: "employee",
      header: "Employee",
      cell: (info: any) => {
        const attendance = info.row.original as Attendance;
        const initials = attendance.employee.name
          ? attendance.employee.name.charAt(0).toUpperCase()
          : "U";
        const displayName = attendance.employee.designation
          ? `${attendance.employee.name || "Unknown"} `
          : attendance.employee.name || "Unknown";
        return (
          <div className="flex items-center space-x-3">
            {attendance.employee.profileUrl ? (
              <img
                src={attendance.employee.profileUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {initials}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-sm text-g-gray-1000">
                {displayName}
              </span>
              <span className="text-g-gray-800 font-normal text-sm">
                {attendance.employee.designation}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: (info: any) => (
        <div className="text-gray-500">{info.getValue() || "N/A"}</div>
      ),
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: (info: any) => {
        const timeValue = info.getValue();
        // Format time as "6:30 PM"
        const formattedTime = timeValue
          ? new Date(`2000-01-01T${timeValue}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          : "N/A";
        return <div className="text-gray-500">{formattedTime}</div>;
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: (info: any) => {
        const dateValue = info.getValue();
        // Format date as "10 Sep, 2025" (3-letter month)
        const formattedDate = dateValue
          ? new Date(dateValue).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: BUSINESS_TIMEZONE,
          })
          : "N/A";
        return <div className="text-gray-500">{formattedDate}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        const colorClass =
          status === "Approved"
            ? "text-g-green-800 bg-g-green-100"
            : status === "Pending"
              ? "text-g-amber-900 bg-g-amber-100"
              : "text-g-red-800 bg-g-red-100";
        const Icon =
          status === "Approved"
            ? MdCheckCircle
            : status === "Pending"
              ? MdInfo
              : MdCancel;
        return (
          <div className="w-[95px]">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} flex items-center gap-1`}
            >
              <Icon className="w-4 h-4" />
              {status}
            </span>
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
          <div className="inline-block text-nowrap bg-g-gray-100 pt-[2px] pr-[8px] pb-[2px] pl-[6px] rounded-[var(--g-radius-full)] text-xs font-medium text-g-gray-900 text-center">
            {attendance.department.name || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: (info: any) => (
        <div className="text-gray-500">{info.getValue() || "N/A"}</div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (info: any) => {
        const attendance = info.row.original as Attendance;
        return (
          <button
            onClick={() => handleOpenDetailsModal(attendance)}
            className="text-gray-500 cursor-pointer hover:text-g-blue-800"
          >
            <FiEye className="w-5 h-5" />
          </button>
        );
      },
    },
  ];
