import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Shift } from "@/utils/types";
import { parse, format, differenceInMinutes } from "date-fns";

interface CustomTableMeta extends TableMeta<Shift & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void;
  selectedRows: Shift[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setShiftToDelete: (id: string) => void;
  handleEdit: (shift: Shift) => void;
}


export const shiftColumns: ColumnDef<Shift, any>[] = [
  {
    id: "selection",
    header: ({ table }) => {
      const allRowsSelected = table
        .getRowModel()
        .rows.every((row) => row.original.selected);

      const someRowsSelected =
        table.getRowModel().rows.some((row) => row.original.selected) &&
        !allRowsSelected;

      return (
        // <CustomCheckbox
        //   id="select-all"
        //   checked={allRowsSelected}
        //   indeterminate={someRowsSelected}
        //   onChange={() => {
        //     const shouldSelectAll = !allRowsSelected;
        //     table.options.data.forEach((shift: any) => {
        //       table.options.meta?.toggleRowSelection?.(shift.id, shouldSelectAll);
        //     });
        //   }}
        // />
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
      const shift = info.row.original as Shift;
      return (
        <CustomCheckbox
          checked={shift.selected || false}
          onChange={() =>
            info.table.options.meta?.toggleRowSelection?.(shift.id)
          }
          id={`checkbox-${shift.id}`}
        />
      );
    },
    size: 40,
  },

  {
    accessorKey: "name",
    header: "Name",
    cell: (info: any) => {
      const shift = info.row.original as Shift;
      return (
        <div className="font-medium text-nowrap text-gray-900">
          {shift.name}
        </div>
      );
    },
  },
  {
    accessorKey: "shiftType",
    header: "Shift Type",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    accessorKey: "startTime",
    header: "Start Time",
    cell: (info: any) => {
      const time = info.getValue();
      try {
        const parsedTime = parse(time, "HH:mm:ss", new Date());
        return (
          <div className="text-gray-500">{format(parsedTime, "hh:mm a")}</div>
        );
      } catch (error) {
        return <div className="text-gray-500">{time}</div>;
      }
    },
  },
  {
    accessorKey: "endTime",
    header: "End Time",
    cell: (info: any) => {
      const time = info.getValue();
      try {
        const parsedTime = parse(time, "HH:mm:ss", new Date());
        return (
          <div className="text-gray-500">{format(parsedTime, "hh:mm a")}</div>
        );
      } catch (error) {
        return <div className="text-gray-500">{time}</div>;
      }
    },
  },
  {
    accessorKey: "breakDuration",
    header: "Break Duration (min)",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
  },
  {
    id: "totalHours",
    header: "Total Hours",
    cell: (info: any) => {
      const shift = info.row.original as Shift;
      try {
        const start = parse(shift.startTime, "HH:mm:ss", new Date());
        const end = parse(shift.endTime, "HH:mm:ss", new Date());
        let totalMinutes = differenceInMinutes(end, start);

        if (totalMinutes < 0) {
          totalMinutes += 24 * 60; // Handle shifts crossing midnight
        }

        totalMinutes -= shift.breakDuration || 0; // Subtract break duration

        // Convert minutes to hh:mm format
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const formatted = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;

        return <div className="text-gray-500">{formatted}</div>;
      } catch (error) {
        return <div className="text-gray-500">-</div>;
      }
    },
  },
  {
    accessorKey: "departmentId",
    header: "Department",
    cell: (info: any) => {
      const shift = info.row.original as Shift;
      return (
        <div className="">
          <span
            className={`${!shift.department?.name ? "" : "px-2 py-[2px]"
              } text-g-gray-900 bg-g-gray-100 rounded-[var(--g-radius-full)] text-nowrap`}
          >
            {shift.department?.name || shift.departmentId}
          </span>
        </div>
      );
    },
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
  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const shift = info.row.original as Shift;
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
              info.table.options.meta?.handleEdit?.(shift);
            }}
            className="text-gray-500 cursor-pointer hover:text-green-600"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.setShiftToDelete?.(shift.id);
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
