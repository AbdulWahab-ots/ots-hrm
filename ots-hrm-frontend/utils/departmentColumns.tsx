import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Department } from "@/utils/types";
import { useRouter } from "next/navigation";

interface CustomTableMeta extends TableMeta<Department & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void; // Add this
  selectedRows: Department[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setBenefitToDelete: (id: string) => void;
  handleEdit: (benefit: Department) => void;
  router: ReturnType<typeof useRouter>;
  onSortChange: (columnId: string, isSorted: false | "asc" | "desc") => void;
}

export const departmentColumns: ColumnDef<Department, any>[] = [
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
      const department = info.row.original as Department;
      return (
        <CustomCheckbox
          checked={department.selected || false}
          onChange={() =>
            info.table.options.meta?.toggleRowSelection?.(department.id)
          }
          id={`checkbox-${department.id}`}
        />
      );
    },
    size: 40,
  },
  {
    accessorKey: "id",
    header: "Id",
    cell: (info: any) => {
      const department = info.row.original as Department;
      return (
        <div className=" text-g-gray-800">#{department?.id?.slice(-6)}</div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Department",
    cell: (info: any) => {
      const department = info.row.original as Department;
      return (
        <div className="font-medium text-nowrap text-gray-900">
          {department.name}
        </div>
      );
    },
  },

  {
    accessorKey: "workingDays",
    header: "Working Days",
    cell: (info: any) => {
      const workingDays = info.getValue() as {
        dayName: string;
        isWorkingDay: boolean;
      }[];
      const selectedDays = workingDays.filter((day) => day.isWorkingDay);
      // .map((day) => day.dayName.substring(0, 3))
      // .filter(Boolean);
      return (
        <div className="text-gray-500">
          {/* {selectedDays.length > 0 ? selectedDays.join(", ") : "None"} */}
          {selectedDays.length}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: (info: any) => (
      <div className="text-gray-500">
        {new Date(info.getValue()).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const department = info.row.original as Department;
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
              info.table.options.meta?.handleEdit?.(department);
            }}
            className="text-gray-500 cursor-pointer hover:text-green-600"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.setDepartmentToDelete?.(department.id);
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
