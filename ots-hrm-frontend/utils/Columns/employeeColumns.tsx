import { ColumnDef } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { Eye } from "lucide-react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Employee } from "@/utils/types";
import { useRouter } from "next/navigation";
import { TableMeta } from "../company";

interface CustomTableMeta extends TableMeta<Employee & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void; // Add this
  selectedRows: Employee[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setBenefitToDelete: (id: string) => void;
  handleEdit: (benefit: Employee) => void;
  handleView: (employee: Employee) => void;
  router: ReturnType<typeof useRouter>;
  onSortChange: (columnId: string, isSorted: false | "asc" | "desc") => void;
}

export const employeeColumns = (
  showCheckbox: boolean = true
): ColumnDef<Employee, any>[] => [
    ...(showCheckbox
      ? [
        {
          id: "selection",
          header: (info: { table: any }) => {
            const { table } = info;
            const allRowsSelected = table
              .getRowModel()
              .rows.every((row: { original: { selected?: boolean } }) => row.original.selected);
            const someRowsSelected = table
              .getRowModel()
              .rows.some((row: { original: { selected?: boolean } }) => row.original.selected);
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
            const employee = info.row.original as Employee;
            return (
              <CustomCheckbox
                checked={employee.selected || false}
                onChange={() =>
                  info.table.options.meta?.toggleRowSelection?.(employee.id)
                }
                id={`checkbox-${employee.id}`}
              />
            );
          },
          size: 40,
        },
      ]
      : []),
    {
      accessorKey: "employeeCode",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={column.getToggleSortingHandler()}
        >
          Emp ID
          {column.getCanSort() && (
            <span className="ml-2">
              {column.getIsSorted() === "asc" ? (
                <FaArrowUp size={12} />
              ) : column.getIsSorted() === "desc" ? (
                <FaArrowDown size={12} />
              ) : (
                <span className="text-g-gray-400">↕</span>
              )}
            </span>
          )}
        </div>
      ),
      cell: (info: any) => (
        <div className="text-g-gray-700 text-nowrap">{info.getValue()}</div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "user",
      header: "Name",
      cell: (info: any) => {
        const employee = info.row.original as Employee;
        return (
          <div className="flex items-center">
            <img
              src={employee.user.pictureUrl || "https://placehold.co/400"}
              alt="Profile"
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <div className="font-medium text-g-gray-1000 text-nowrap">
                {employee.user.userName}
              </div>
              <div className="text-sm text-g-gray-700 text-nowrap">
                {employee.designation?.title || ""}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "user.email",
      header: "Email Address",
      cell: (info: any) => <div className="text-g-gray-700">{info.getValue()}</div>,
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: (info: any) => <div className="text-g-gray-700">{info.getValue()}</div>,
    },
    {
      accessorKey: "department.name",
      header: "Department",
      cell: (info: any) => (
        <div>
          <span className="text-g-gray-900 text-nowrap bg-g-gray-100 px-2 py-[2px] rounded-[var(--g-radius-full)]">
            {info.getValue()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "joiningDate",
      header: "Joining Date",
      cell: (info: any) => (
        <div>
          <span className="text-g-gray-700 text-nowrap">{info.getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue();
        const colorClass =
          status === "PERMANENT"
            ? "text-g-blue-800 bg-g-blue-100"
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
      id: "actions",
      header: "",
      cell: (info: any) => {
        const employee = info.row.original as Employee;
        return (
          <div className="flex items-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                info.table.options.meta?.handleView?.(employee);
              }}
              className="text-g-gray-700 cursor-pointer hover:text-g-blue-700"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                info.table.options.meta?.handleEdit?.(employee);
              }}
              className="text-g-gray-700 cursor-pointer hover:text-g-green-800"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                info.table.options.meta?.setEmployeeToDelete?.(employee.id);
                info.table.options.meta?.setIsBulkDelete?.(false);
                info.table.options.meta?.setIsDeleteModalOpen?.(true);
              }}
              className="text-g-gray-700 cursor-pointer hover:text-g-red-700"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];
