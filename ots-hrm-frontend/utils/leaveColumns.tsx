import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import ToggleButton from "@/components/common/form/ToggleButton";
import { LeaveType } from "@/utils/types";
import { useRouter } from "next/navigation";

interface CustomTableMeta extends TableMeta<LeaveType & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void; // Add this
  selectedRows: LeaveType[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setBenefitToDelete: (id: string) => void;
  handleEdit: (benefit: LeaveType) => void;
  router: ReturnType<typeof useRouter>;
  onSortChange: (columnId: string, isSorted: false | "asc" | "desc") => void;
}

export const leaveColumns: ColumnDef<LeaveType & { selected?: boolean }, any>[] = [
  {
    id: "selection",
    header: (info) => {
      const { table } = info;
      const allRowsSelected = table
        .getRowModel()
        .rows.every((row) => row.original.selected);
      const someRowsSelected = table
        .getRowModel()
        .rows.some((row) => row.original.selected);
      return (
        <CustomCheckbox
          checked={allRowsSelected}
          indeterminate={someRowsSelected && !allRowsSelected}
          onChange={() => {
            (table.options.meta as CustomTableMeta).toggleAllRowsSelection(
              !allRowsSelected
            );
          }}
          id="select-all-checkbox"
        />
      );
    },
    cell: (info: any) => {
      const leave = info.row.original as LeaveType;
      return (
        <CustomCheckbox
          checked={leave.selected || false}
          onChange={() =>
            info.table.options.meta?.toggleRowSelection?.(leave.id)
          }
          id={`checkbox-${leave.id}`}
        />
      );
    },
    size: 40,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => {
      const leave = info.row.original as LeaveType;
      return (
        <div className="font-medium text-nowrap text-gray-900">
          {leave.name}
        </div>
      );
    },
  },
  {
    accessorKey: "maxDaysPerYear",
    header: "Max Days",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    accessorKey: "maxConsecutiveDays",
    header: "Consecutive Days",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    accessorKey: "requiresApproval",
    header: "Approval Required",
    cell: (info: any) => {
      const leave = info.row.original as LeaveType;
      return (
        <ToggleButton
          initialValue={leave.requiresApproval}
          disabled={true}
          trueBgColor="#597BE880"
          falseBgColor="#F5F5F5"
        />
      );
    },
  },
  {
    accessorKey: "isPaid",
    header: "Is Paid",
    cell: (info: any) => {
      const leave = info.row.original as LeaveType;
      return (
        <ToggleButton
          initialValue={leave.isPaid}
          disabled={true}
          trueBgColor="#597BE880"
          falseBgColor="#F5F5F5"
        />
      );
    },
  },
  {
    accessorKey: "departmentId",
    header: "Departments",
    cell: (info: any) => {
      const leave = info.row.original as LeaveType;
      return (
        <div className="text-nowrap">
          <span
            className={`${!leave.department?.name ? "" : "px-2 py-[2px]"
              } text-g-gray-900 bg-g-gray-100 rounded-[var(--g-radius-full)] text-nowrap`}
          >
            {leave.department?.name || leave.departmentId}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: (info: any) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const leave = info.row.original as LeaveType;
      const selectedRows = info.table.options.meta?.selectedRows || [];
      const tableLength = info.table.getRowModel().rows.length;

      if (selectedRows.length > 0) {
        if (info.row.index === tableLength - 3) {
          return (
            <div className="flex justify-center w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  info.table.options.meta?.setIsBulkDelete?.(true);
                  info.table.options.meta?.setIsDeleteModalOpen?.(true);
                }}
                className="text-gray-500 cursor-pointer hover:text-red-600"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          );
        }
        return null;
      }

      return (
        <div className="flex items-center space-x-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.handleEdit?.(leave);
            }}
            className="text-gray-500 cursor-pointer hover:text-green-600"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.setLeaveToDelete?.(leave.id);
              info.table.options.meta?.setIsBulkDelete?.(false);
              info.table.options.meta?.setIsDeleteModalOpen?.(true);
            }}
            className="text-gray-500 cursor-pointer hover:text-red-600"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      );
    },
  },
];
