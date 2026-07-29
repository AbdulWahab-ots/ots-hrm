import { ColumnDef } from "@tanstack/react-table";
import { FiEye } from "react-icons/fi";
import { Vocation } from "@/utils/company";
import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { RxCross2 } from "react-icons/rx";
import { GrCheckmark } from "react-icons/gr";

export const AdminVocationColumns: ColumnDef<Vocation, any>[] = [
  {
    accessorKey: "requestedByUser.userName",
    header: "Employee",
    cell: (info: any) => {
      const leave = info.row.original as Vocation;
      const { firstName, lastName, pictureUrl, userName } =
        leave.requestedByUser;
      const initials = userName ? userName.slice(0, 2).toUpperCase() : "";
      return (
        <div className="flex items-center space-x-3 text-nowrap">
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={`${firstName} ${lastName || ""}`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
              {initials}
            </div>
          )}
          <span className="font-medium text-gray-900">
            {`${firstName} ${lastName || ""}`}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "leaveType.name",
    header: "Leave Type",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    accessorKey: "leaveType.department.name",
    header: "Department",
    cell: (info: any) => {
      const departmentName = info.getValue() || "No Department";
      return (
        <div className="text-nowrap">
          <span className="px-2 py-[2px] text-g-gray-900 bg-g-gray-100 rounded-[var(--g-radius-full)]">
            {departmentName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "fromDate",
    header: "Duration",
    cell: (info: any) => {
      const leave = info.row.original as Vocation;

      const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        });

      const formatDateRange = () => {
        if (!leave.fromDate || !leave.toDate) return "N/A";

        const start = formatDate(leave.fromDate);
        const end = formatDate(leave.toDate);

        // check if both dates are same
        if (leave.fromDate === leave.toDate) {
          return start;
        }

        return `${start} - ${end}`;
      };

      return <div className="text-gray-500">{formatDateRange()}</div>;
    },
  },
  {
    accessorKey: "totalDays",
    header: "Days",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: (info: any) => {
      const status = info.getValue();
      const colorClass =
        status === "APPROVED"
          ? "text-g-green-800 bg-g-green-100"
          : status === "PENDING"
            ? "text-g-amber-900 bg-g-amber-100"
            : "text-g-red-800 bg-g-red-100";
      const Icon =
        status === "APPROVED"
          ? GrCheckmark
          : status === "PENDING"
            ? AiOutlineExclamationCircle
            : RxCross2;
      return (
        <div className="w-[95px] flex items-center">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} flex items-center gap-1`}
          >
            <Icon className="w-3 h-3 mb-0.5" />
            {status}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const leave = info.row.original as Vocation;
      return (
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.handleView?.(leave);
            }}
            className="text-gray-500 cursor-pointer hover:text-blue-600"
          >
            <FiEye size={16} />
          </button>
        </div>
      );
    },
  },
];
