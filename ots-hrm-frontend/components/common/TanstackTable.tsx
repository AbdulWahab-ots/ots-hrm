// src/components/common/TanstackTable.tsx

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import React, { useState, forwardRef } from "react";
import BulkDeleteButton from "./BulkDeleteButton";
import NoDataFound from "./NoDataFound";
import { useRef, useEffect } from "react";

interface TanstackTableProps<T extends { id: string }> {
  columns: ColumnDef<T, any>[];
  data: T[];
  className?: string;
  isLoading?: boolean;
  emptyText?: string;
  showCheckboxes?: boolean;
  selectedRows?: T[];
  meta?: any;
  enableSorting?: boolean;
  showTdBottomBorder?: boolean;
  showBulkDelete?: boolean;
  onRowClick?: (row: T) => void;
}

export const TanstackTable = forwardRef<
  HTMLTableSectionElement,
  TanstackTableProps<any>
>(
  (
    {
      columns,
      data,
      className = "",
      isLoading = false,
      emptyText = "No data found.",
      showCheckboxes = false,
      selectedRows = [],
      meta,
      enableSorting = false,
      showTdBottomBorder = false,
      showBulkDelete = false,
      onRowClick,
    },
    ref
  ) => {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
      state: {
        rowSelection: selectedRows.reduce((acc, row) => {
          acc[row.id] = true;
          return acc;
        }, {} as Record<string, boolean>),
        sorting,
      },
      onSortingChange: (updater) => {
        setSorting(updater);
        if (meta?.onSortChange) {
          const newSorting =
            typeof updater === "function" ? updater(sorting) : updater;
          const sort = newSorting[0];
          meta.onSortChange(
            sort?.id,
            sort?.desc ? "desc" : sort?.id ? "asc" : false
          );
        }
      },
      meta,
    });
    useEffect(() => {
      table.setOptions((prev) => ({ ...prev, data }));
    }, [data]);

    const SkeletonRow = ({
      index,
      totalRows,
    }: {
      index: number;
      totalRows: number;
    }) => (
      <tr
        className="hover:bg-gray-50"
        style={
          showTdBottomBorder && index < totalRows - 1
            ? { borderBottom: "1px solid var(--g-gray-alpha-400)" }
            : {}
        }
      >
        {showCheckboxes && (
          <td className="py-4 px-6">
            <div className="h-4 w-4 bg-gray-200 rounded-[var(--g-radius-sm)] animate-pulse" />
          </td>
        )}
        {columns.map((_, colIndex) => (
          <td key={colIndex} className="py-4 px-6">
            <div className="h-4 bg-gray-200 rounded-[var(--g-radius-sm)] animate-pulse w-3/4" />
          </td>
        ))}
      </tr>
    );

    const tableBodyRef = React.useRef<HTMLTableSectionElement | null>(null);
    const [tableBodyHeight, setTableBodyHeight] = useState(0);

    useEffect(() => {
      if (tableBodyRef.current) {
        setTableBodyHeight(tableBodyRef.current.offsetHeight);
      }
    }, [data]);

    //  Merge both refs (forwarded + local)
    const setRefs = (el: HTMLTableSectionElement) => {
      tableBodyRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.RefObject<HTMLTableSectionElement | null>).current = el;
    };
    return (
      <div className={`overflow-x-auto ${className}`}>
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full">
            <thead className="bg-g-background-200 border-t-[1px] border-g-gray-alpha-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, id) => (
                    <th
                      key={id}
                      className="py-[15px] px-6 text-left text-nowrap text-label-13 font-medium text-(--genrel-text-light) tracking-wider focus-ring-geist"
                      style={
                        enableSorting && header.column.getCanSort()
                          ? { cursor: "pointer" }
                          : {}
                      }
                      onClick={
                        enableSorting
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody ref={setRefs} className="bg-g-background-100">
              {isLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonRow key={index} index={index} totalRows={4} />
                  ))}
                </>
              ) : data.length === 0 ? (
                <tr
                  style={showTdBottomBorder ? {} : {}} // No border for empty state
                >
                  <td
                    colSpan={columns.length + (showCheckboxes ? 1 : 0)}
                    className="p-4 text-center"
                  >
                    <NoDataFound text={emptyText} />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""
                      }`}
                    onClick={
                      onRowClick ? () => onRowClick(row.original) : undefined
                    }
                    style={
                      showTdBottomBorder &&
                        index < table.getRowModel().rows.length - 1
                        ? { borderBottom: "1px solid var(--g-gray-alpha-400)" }
                        : {}
                    }
                  >
                    {row.getVisibleCells().map((cell, id) => (
                      <td key={id} className="py-4 px-6 text-copy-14">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {showBulkDelete && (
            <BulkDeleteButton
              selectedRowsLength={selectedRows.length}
              tableBodyHeight={tableBodyHeight}
              onBulkDelete={() => {
                if (meta?.setIsBulkDelete) meta.setIsBulkDelete(true);
                if (meta?.setIsDeleteModalOpen) meta.setIsDeleteModalOpen(true);
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

TanstackTable.displayName = "TanstackTable";

export const Avatar = ({
  name,
  imageUrl,
  className = "",
  size = "md",
}: {
  name: string;
  imageUrl?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gray-200 ${sizeClasses[size]} ${className}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="font-medium text-gray-600">{initials}</span>
      )}
    </div>
  );
};
