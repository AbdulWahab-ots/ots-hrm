import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Designation } from "@/utils/types";
import { useRouter } from "next/navigation";

// Define the custom TableMeta interface
interface CustomTableMeta
  extends TableMeta<Designation & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void;
  selectedRows: Designation[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setDesignationToDelete: (id: string) => void;
  handleEdit: (designation: Designation) => void;
  router: ReturnType<typeof useRouter>;
}

export const designationColumns: ColumnDef<
  Designation & { selected?: boolean },
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
        const designation = info.row.original as Designation & {
          selected?: boolean;
        };
        return (
          <CustomCheckbox
            checked={designation.selected || false}
            onChange={() =>
              (info.table.options.meta as CustomTableMeta).toggleRowSelection(
                designation.id
              )
            }
            id={`checkbox-${designation.id}`}
          />
        );
      },
      size: 40,
    },
    {
      accessorKey: "title",
      header: "Designation",
      cell: (info) => {
        const designation = info.row.original as Designation;
        return (
          <div className="font-medium text-sm text-nowrap text-([--surface-secondary])">
            {designation.title}
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: (info) => {
        const designation = info.row.original as Designation;
        return (
          <div className="text-g-gray-800 font-medium text-sm text-nowrap">
            {designation.department?.name || "N/A"}
          </div>
        );
      },
    },
    // Empty columns
    {
      id: "empty1",
      header: "",
      cell: () => <div></div>,
      size: 100,
    },
    {
      id: "empty2",
      header: "",
      cell: () => <div></div>,
      size: 100,
    },
    {
      id: "empty3",
      header: "",
      cell: () => <div></div>,
      size: 100,
    },
    {
      id: "empty4",
      header: "",
      cell: () => <div></div>,
      size: 100,
    },
    {
      id: "actions",
      header: "",
      cell: (info) => {
        const designation = info.row.original as Designation;
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
                  className="text-g-gray-900 cursor-pointer hover:text-red-600"
                >
                  <FiTrash2 size={16} className="text-g-gray-900" />
                </button>
              </div>
            );
          }
          return null;
        }

        return (
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                meta.handleEdit(designation);
              }}
              className="text-g-gray-900 cursor-pointer hover:text-green-600"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                meta.setDesignationToDelete(designation.id);
                meta.setIsBulkDelete(false);
                meta.setIsDeleteModalOpen(true);
              }}
              className="text-g-gray-900 cursor-pointer hover:text-red-600"
            >
              <FiTrash2 size={16} color="currentColor" />
            </button>
          </div>
        );
      },
    },
  ];
