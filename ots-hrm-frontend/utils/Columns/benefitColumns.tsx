import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Benefit } from "@/utils/types";
import { useRouter } from "next/navigation";

// Define the custom TableMeta interface
interface CustomTableMeta extends TableMeta<Benefit & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void; // Add this
  selectedRows: Benefit[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setBenefitToDelete: (id: string) => void;
  handleEdit: (benefit: Benefit) => void;
  router: ReturnType<typeof useRouter>;
  onSortChange: (columnId: string, isSorted: false | "asc" | "desc") => void;
}

export const benefitColumns: ColumnDef<
  Benefit & { selected?: boolean },
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
      cell: (info) => {
        const benefit = info.row.original as Benefit & { selected?: boolean };
        return (
          <CustomCheckbox
            checked={benefit.selected || false}
            onChange={() =>
              (info.table.options.meta as CustomTableMeta).toggleRowSelection(
                benefit.id
              )
            }
            id={`checkbox-${benefit.id}`}
          />
        );
      },
      size: 40,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={column.getToggleSortingHandler()}
        >
          Name
        </div>
      ),
      cell: (info) => {
        const benefit = info.row.original as Benefit;
        return (
          <div className="text-nowrap text-g-gray-1000 font-medium text-sm">
            {benefit.name}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={column.getToggleSortingHandler()}
        >
          Type
        </div>
      ),
      cell: (info) => (
        <div className="text-g-gray-800 text-sm font-medium">
          {info.getValue()}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <div
          className="flex items-center cursor-pointer"
          onClick={column.getToggleSortingHandler()}
        >
          Value
          {column.getCanSort() && (
            <span className="ml-2">
              {column.getIsSorted() === "asc" ? (
                <FaArrowUp size={12} />
              ) : column.getIsSorted() === "desc" ? (
                <FaArrowDown size={12} />
              ) : (
                <span className="text-gray-300">↕</span>
              )}
            </span>
          )}
        </div>
      ),
      cell: (info) => (
        <div className="text-g-gray-800 text-sm font-medium">
          {info.getValue()}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "valueType",
      header: "Value Type",
      cell: (info) => (
        <div className="text-g-gray-800 text-sm font-medium capitalize">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: (info) => {
        const frequency = info.getValue() as string;
        let progress = 0;
        const now = new Date();

        switch (frequency) {
          case "YEARLY": {
            const startYear = new Date(now.getFullYear(), 0, 1);
            const endYear = new Date(now.getFullYear() + 1, 0, 1);
            const totalYearMs = endYear.getTime() - startYear.getTime();
            progress =
              ((now.getTime() - startYear.getTime()) / totalYearMs) * 100;
            break;
          }
          case "MONTHLY": {
            const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const totalMonthMs = endMonth.getTime() - startMonth.getTime();
            progress =
              ((now.getTime() - startMonth.getTime()) / totalMonthMs) * 100;
            break;
          }
          case "QUARTERLY": {
            const quarter = Math.floor(now.getMonth() / 3) + 1;
            const startQuarterMonth = (quarter - 1) * 3;
            const startQuarter = new Date(
              now.getFullYear(),
              startQuarterMonth,
              1
            );
            const endQuarter = new Date(
              now.getFullYear(),
              startQuarterMonth + 3,
              1
            );
            const totalQuarterMs = endQuarter.getTime() - startQuarter.getTime();
            progress =
              ((now.getTime() - startQuarter.getTime()) / totalQuarterMs) * 100;
            break;
          }
          case "ONE_TIME": {
            const startDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            const endDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1
            );
            const totalDayMs = endDay.getTime() - startDay.getTime();
            progress = ((now.getTime() - startDay.getTime()) / totalDayMs) * 100;
            break;
          }
          default:
            progress = 0;
        }

        return (
          <div className="flex flex-col">
            <div className="flex items-center">
              <div className="w-full bg-g-gray-100 rounded-full h-2.5 mr-2">
                <div
                  className="bg-[#597BE8] h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <div className="flex text-xs mt-1 capitalize text-g-gray-900 justify-end">
              <span className=" ">{`${Math.round(progress)}%`}</span>
              <div className=" capitalize ">({frequency})</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "departmentId",
      header: "Departments",
      cell: (info) => {
        const benefit = info.row.original as Benefit;
        return (
          <div className="capitalize">
            <span
              className={`${!benefit.department?.name ? "" : "px-2 py-[2px]"
                } text-g-gray-900 bg-g-gray-100 rounded-[var(--g-radius-full)] text-nowrap`}
            >
              {benefit.department?.name || benefit.departmentId}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => (
        <div className="text-g-gray-800 text-sm font-medium capitalize">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: (info) => {
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
    {
      id: "actions",
      header: "",
      cell: (info) => {
        const benefit = info.row.original as Benefit;
        const meta = info.table.options.meta as CustomTableMeta;
        const selectedRows = meta.selectedRows || [];
        const tableLength = info.table.getRowModel().rows.length;

        if (selectedRows.length > 0) {
          if (info.row.index === tableLength - 3) {
            return (
              <div className="flex justify-center w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    meta.setIsBulkDelete(true);
                    meta.setIsDeleteModalOpen(true);
                  }}
                  className="text-g-gray-800 text-sm font-medium cursor-pointer hover:text-red-600"
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
                meta.handleEdit(benefit);
              }}
              className="text-g-gray-800 text-sm font-medium cursor-pointer hover:text-green-600"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                meta.setBenefitToDelete(benefit.id);
                meta.setIsBulkDelete(false);
                meta.setIsDeleteModalOpen(true);
              }}
              className="text-g-gray-800 text-sm font-medium cursor-pointer hover:text-red-600"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];
