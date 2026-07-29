import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { MoreVertical, Check, CircleAlert } from "lucide-react";

import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import { Avatar } from "@/components/common/TanstackTable";
import { Payroll } from "../../components/admin/dashboard/PendingPayrollTable";

type PayrollStatus = "Paid" | "Pending" | "Action Required";

/* Status pill styling — one entry per state, all on Geist tokens so light and
   dark both resolve. Dot + label (never color alone). */
const STATUS_STYLES: Record<
  PayrollStatus,
  { wrap: string; dot: string }
> = {
  Paid: { wrap: "bg-g-green-100 text-g-green-900", dot: "bg-g-green-700" },
  Pending: { wrap: "bg-g-amber-100 text-g-amber-900", dot: "bg-g-amber-700" },
  "Action Required": { wrap: "bg-g-red-100 text-g-red-900", dot: "bg-g-red-700" },
};

const StatusBadge = ({ status }: { status: PayrollStatus }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-12 font-medium ${s.wrap}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

export const PayrollColumns = ({
  handleStatusChange,
  showCheckbox = true,
}: {
  handleStatusChange: (payroll: Payroll, status: PayrollStatus) => void;
  showCheckbox?: boolean;
}): ColumnDef<Payroll, any>[] => {
  const ActionCell = ({ row }: { row: any }) => {
    const payroll = row.original as Payroll;
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click.
    useEffect(() => {
      if (!isOpen) return;
      const onClick = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }, [isOpen]);

    return (
      <div className="relative flex justify-end" ref={ref}>
        <button
          aria-label="Change payroll status"
          className="flex items-center justify-center w-9 h-9 rounded-[var(--g-radius-sm)] text-g-gray-800 hover:bg-g-gray-alpha-100 hover:text-g-gray-1000 transition-colors focus-ring-geist"
          onClick={() => setIsOpen((o) => !o)}
        >
          <MoreVertical size={18} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-11 w-52 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-menu z-20 overflow-hidden p-1">
            <p className="px-3 py-1.5 text-label-12 uppercase tracking-wider text-g-gray-700">
              Set status
            </p>
            {(["Paid", "Pending", "Action Required"] as PayrollStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => {
                    handleStatusChange(payroll, status);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-[var(--g-radius-sm)] text-copy-14 text-g-gray-900 hover:bg-g-gray-alpha-100 hover:text-g-gray-1000 flex justify-between items-center transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <StatusBadge status={status} />
                  </span>
                  {status === payroll.status && (
                    <Check size={15} className="text-g-blue-700 shrink-0" />
                  )}
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return [
    ...(showCheckbox
      ? [
          {
            id: "selection",
            header: "",
            cell: (info: any) => {
              const payroll = info.row.original;
              return (
                <CustomCheckbox
                  checked={payroll.selected || false}
                  onChange={() =>
                    info.table.options.meta?.toggleRowSelection?.(payroll.id)
                  }
                  id={`checkbox-${payroll.id}`}
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
        <div className="font-medium text-g-gray-900 text-copy-14">
          {info.getValue() || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "employee",
      header: "Employee",
      cell: (info) => {
        const payroll = info.row.original as Payroll;
        return (
          <div className="flex text-nowrap items-center gap-3">
            <Avatar
              name={payroll.employee.name}
              imageUrl={payroll.employee.profileUrl}
              size="lg"
            />
            <div>
              <div className="font-medium text-copy-14 text-g-gray-1000">
                {payroll.employee.name}
              </div>
              <div className="text-label-13 text-g-gray-700">
                {payroll.employee.designation}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <div className="flex items-center gap-1">
          <span>Status</span>
          <CircleAlert size={14} className="text-g-gray-700" />
        </div>
      ),
      cell: (info) => <StatusBadge status={info.getValue() as PayrollStatus} />,
    },
    {
      accessorKey: "grossSalary",
      header: "Total Salary",
      cell: (info) => (
        <div className="text-g-gray-1000 font-medium text-copy-14">
          ${Number(info.getValue()).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
    {
      id: "action",
      header: () => <div className="text-right">Action</div>,
      cell: ActionCell,
    },
  ];
};
