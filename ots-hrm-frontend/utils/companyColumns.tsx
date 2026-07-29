import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { FiTrash2, FiUsers, FiEdit2 } from "react-icons/fi";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Avatar } from "@/components/common/TanstackTable";
import { Company, Users } from "@/utils/types";
import { useRouter } from "next/navigation";

interface CustomTableMeta extends TableMeta<Company & { selected?: boolean }> {
  toggleRowSelection: (id: string) => void;
  toggleAllRowsSelection: (selectAll: boolean) => void;
  selectedRows: Company[];
  setIsBulkDelete: (value: boolean) => void;
  setIsDeleteModalOpen: (value: boolean) => void;
  setCompanyToDelete: (id: string) => void;
  handleEdit: (company: Company) => void;
  router: ReturnType<typeof useRouter>;
}

export const companyColumns: ColumnDef<Company, any>[] = [
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
      const company = info.row.original as Company & { selected?: boolean };
      return (
        <CustomCheckbox
          checked={company.selected || false}
          onChange={() =>
            (info.table.options.meta as CustomTableMeta).toggleRowSelection(
              company.id
            )
          }
          id={`checkbox-${company.id}`}
        />
      );
    },
    size: 40,
  },
  {
    accessorKey: "name",
    header: "Company",
    cell: (info: any) => {
      const company = info.row.original as Company;
      return (
        <div className="flex text-nowrap items-center">
          <Avatar
            name={company.name}
            imageUrl={company.logoUrl || ""}
            className="mr-3"
            size="lg"
          />
          <div className="font-medium text-nowrap text-gray-900">
            {company.name}
          </div>
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
    accessorKey: "email",
    header: "Email",
    cell: (info: any) => <div className="text-gray-500">{info.getValue()}</div>,
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
    accessorKey: "users",
    header: "Admins",
    cell: (info: any) => {
      const users = info.getValue() as Users[];
      const visibleUsers = users.slice(0, 5);
      const extraCount = users.length > 5 ? users.length - 5 : 0;

      return (
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user, index) => (
            <div key={`${user.userName}-${index}`} className="relative group">
              <Avatar
                name={user.userName}
                imageUrl={user.pictureUrl || ""}
                className="border-2 border-white hover:z-10 hover:scale-110 transition-transform"
                size="sm"
              />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {user.userName}
              </div>
            </div>
          ))}
          {extraCount > 0 && (
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#F7F8FE] border-2 border-white text-xs font-medium text-g-blue-700">
              +{extraCount}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: (info: any) => {
      const company = info.row.original as Company;
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
              info.table.options.meta?.router?.push(
                `/superadmin/companies/${company.id}`
              );
            }}
            className="text-gray-500 cursor-pointer hover:text-blue-600"
          >
            <FiUsers size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.handleEdit?.(company);
            }}
            className="text-gray-500 cursor-pointer hover:text-green-600"
          >
            <FiEdit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              info.table.options.meta?.setCompanyToDelete?.(company.id);
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
