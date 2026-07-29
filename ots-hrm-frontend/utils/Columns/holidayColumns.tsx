import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import ToggleButton from "@/components/common/form/ToggleButton";
import { Holiday } from "@/utils/types";
import { useRouter } from "next/navigation";

interface CustomTableMeta extends TableMeta<Holiday & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void; // Add this
  selectedRows: Holiday[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setHolidayToDelete: (id: string) => void;
  handleEdit: (Holiday: Holiday) => void;
  router: ReturnType<typeof useRouter>;
  onSortChange: (columnId: string, isSorted: false | "asc" | "desc") => void;
}

export const holidayColumns: ColumnDef<Holiday & { selected?: boolean },
  any
>[] = [
    {
      id: "selection",
      header: (info) => {
        const { table } = info;
        const allRowsSelected = table
          .getRowModel()
          .rows.every((row) => row.original.selected);
        const someRowsSelected = table
          .getRowModel()
          .rows.some((row) => row.original.selected)

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
        )
      },
      cell: (info: any) => {
        const holiday = info.row.original as Holiday & { selected?: boolean };
        return (
          <CustomCheckbox
            checked={holiday.selected || false}
            onChange={() =>
              info.table.options.meta?.toggleRowSelection?.(holiday.id)
            }
            id={`checkbox-${holiday.id}`}
          />
        );
      },
      size: 40,
    },
    {
      accessorKey: "name",
      header: "Holiday Name",
      cell: (info: any) => {
        const holiday = info.row.original as Holiday;
        return (
          <div className="font-medium text-nowrap text-gray-900">
            {holiday.name}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
    },
    {
      accessorKey: "dates",
      header: "Day",
      cell: (info: any) => {
        const holiday = info.row.original as Holiday;
        return (
          <div className="text-gray-500">
            {holiday.dates
              .map((date) => new Date(date).toLocaleDateString())
              .join(", ")}
          </div>
        );
      },
    },
    {
      accessorKey: "departmentId",
      header: "Departments",
      cell: (info: any) => {
        const holiday = info.row.original as Holiday;
        return (
          <div className="text-gray-500">{holiday.department?.name || "All"}</div>
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
      accessorKey: "active",
      header: "Status",
      cell: (info: any) => {
        const status = info.getValue() ? "Active" : "Inactive";
        const colorClass =
          status === "Active"
            ? "text-g-green-800 bg-g-green-100"
            : "text-g-red-800 bg-g-red-100";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
          >
            {status}
          </span>
        );
      },
    },
    // {
    //   accessorKey: "whichCountryId",
    //   header: "Country",
    //   cell: (info: any) => {
    //     const holiday = info.row.original as Holiday;
    //     return (
    //       <div className="text-gray-500">
    //         {holiday.whichCountryId ? holiday.whichCountryId.slice(-6) : "N/A"}
    //       </div>
    //     );
    //   },
    // },
    {
      id: "actions",
      header: "",
      cell: (info: any) => {
        const holiday = info.row.original as Holiday;
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
                info.table.options.meta?.handleEdit?.(holiday);
              }}
              className="text-gray-500 cursor-pointer hover:text-green-600"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                info.table.options.meta?.setHolidayToDelete?.(holiday.id);
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
