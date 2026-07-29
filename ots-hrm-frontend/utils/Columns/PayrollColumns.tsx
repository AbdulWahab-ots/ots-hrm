import { Payroll } from "../../components/admin/paystub/PayrollTable";
import { ColumnDef } from "@tanstack/react-table";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useState } from "react";
import { TbCameraCheck } from "react-icons/tb";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { PayrollStatus } from "@/services/payrollService";

// ponytail: handleEdit and handleStatusChange are optional so employee-context
// reuse (Task 3/4) can omit them without breaking the column definition.
export const PayrollColumns = ({
  handleOpenDetailsModal,
  handleEdit,
  handleStatusChange,
  handleDelete,
  showSelection = true,
}: {
  handleOpenDetailsModal: (payroll: Payroll) => void;
  handleEdit?: (payroll: Payroll) => void;
  handleStatusChange?: (payroll: Payroll, status: PayrollStatus) => void;
  handleDelete?: (payroll: Payroll) => void;
  // ponytail: read-only contexts (employee payslips) omit the row-selection
  // checkbox — it has no handler there and implies a bulk action that doesn't exist.
  showSelection?: boolean;
}): ColumnDef<Payroll, any>[] => {
  const ALL_STATUSES: PayrollStatus[] = [
    "DRAFT",
    "PENDING",
    "APPROVED",
    "REJECTED",
    "PAID",
    "CANCELLED",
  ];

  const statusLabel: Record<PayrollStatus, string> = {
    DRAFT: "Draft",
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PAID: "Paid",
    CANCELLED: "Cancelled",
  };

  // Green: PAID / APPROVED   Amber: PENDING / DRAFT   Red: REJECTED / CANCELLED
  const statusColor: Record<PayrollStatus, string> = {
    PAID: "text-g-green-800 bg-g-green-100",
    APPROVED: "text-g-green-800 bg-g-green-100",
    PENDING: "text-g-amber-900 bg-g-amber-100",
    DRAFT: "text-g-amber-900 bg-g-amber-100",
    REJECTED: "text-g-red-800 bg-g-red-100",
    CANCELLED: "text-g-red-800 bg-g-red-100",
  };

  const ActionCell = ({ row }: { row: any }) => {
    const payroll = row.original as Payroll;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
      <div className="flex items-center gap-3 relative">
        {/* Edit Icon — only when handleEdit provided */}
        {handleEdit && (
          <button
            onClick={() => handleEdit(payroll)}
            className="text-g-gray-900 hover:text-g-blue-800 cursor-pointer"
            title="Edit"
          >
            <FiEdit2 className="w-5 h-5" />
          </button>
        )}

        {/* View Icon */}
        <button
          onClick={() => handleOpenDetailsModal(payroll)}
          className="text-gray-500 hover:text-g-blue-800 cursor-pointer"
          title="View"
        >
          <FiEye className="w-5 h-5" />
        </button>

        {/* Status change — only when handleStatusChange provided */}
        {handleStatusChange && (
          <>
            <button
              className="border-[1px] border-g-blue-200 rounded-xl bg-g-blue-100 text-g-blue-700 p-[10px]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <TbCameraCheck />
            </button>
            {isDropdownOpen && (
              <div className="absolute left-[-100px] top-8 w-48 bg-g-background-100 border border-g-gray-alpha-400 rounded-lg shadow-lg z-10">
                {ALL_STATUSES.filter((s) => s !== payroll.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      handleStatusChange(payroll, status);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Set to {statusLabel[status]}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Delete — only when handleDelete provided (admin) */}
        {handleDelete && (
          <button
            onClick={() => handleDelete(payroll)}
            className="text-gray-500 hover:text-g-red-800 cursor-pointer"
            title="Delete"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  };

  return [
    ...(showSelection
      ? [
          {
            id: "selection",
            header: "",
            cell: (info: any) => {
              const benefit = info.row.original;
              return (
                <CustomCheckbox
                  checked={benefit.selected || false}
                  onChange={() =>
                    info.table.options.meta?.toggleRowSelection?.(benefit.id)
                  }
                  id={`checkbox-${benefit.id}`}
                />
              );
            },
            size: 40,
          },
        ]
      : []),
    {
      accessorKey: "employee.id",
      header: "Emp ID",
      cell: (info) => (
        <div className="text-gray-500">{info.getValue() || "N/A"}</div>
      ),
    },
    {
      accessorKey: "employee",
      header: "Employee",
      cell: (info) => {
        const payroll = info.row.original as Payroll;
        return (
          <div className="flex text-nowrap items-center space-x-3">
            <img
              src={
                payroll.employee.profileUrl ||
                "https://placehold.co/600x400/png"
              }
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-medium text-gray-900">
                {payroll.employee.name}
              </div>
              <div className="text-sm text-gray-500">
                {payroll.employee.designation}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "month",
      header: "Month",
      cell: (info) => {
        const month = info.getValue() as string | undefined;
        return (
          <div className="text-gray-500">
            {month
              ? (() => {
                  const [y, m] = month.split("-");
                  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" }
                  );
                })()
              : "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue() as PayrollStatus;
        const colorClass = statusColor[status] ?? "text-g-gray-900 bg-g-gray-100";
        return (
          <div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} flex items-center gap-1`}
            >
              {statusLabel[status] ?? status}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "grossSalary",
      header: "Gross Salary",
      cell: (info) => (
        <div className="text-gray-500">PKR {info.getValue().toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: (info) => {
        const payroll = info.row.original as Payroll;
        return (
          <div>
            <span className="px-2 py-[2px] text-g-gray-900 bg-g-gray-100 rounded-[var(--g-radius-full)]">
              {payroll.department.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "baseSalary",
      header: "Base Salary",
      cell: (info) => (
        <div className="text-gray-500">PKR {info.getValue().toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "benefits",
      header: "Benefits",
      cell: (info) => (
        <div className="text-gray-500">PKR {info.getValue().toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "taxDeductions",
      header: "Tax Deductions",
      cell: (info) => (
        <div className="text-gray-500">PKR {info.getValue().toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "leavesDeduction",
      header: "Leaves Deduction",
      cell: (info) => (
        <div className="text-gray-500">PKR {info.getValue().toLocaleString()}</div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: ActionCell,
    },
  ];
};
