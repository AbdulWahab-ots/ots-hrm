// frontend/components/employee/paystub/EmployeePayslips.tsx
"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { TanstackTable } from "@/components/common/TanstackTable";
import CustomModal from "@/components/common/CustomModal";
import CountBadge from "@/components/common/CountBadge";
import { PayrollColumns } from "@/utils/Columns/PayrollColumns";
import { fetchPayrolls } from "@/services/payrollService";
import { payrollToRow, type Payroll } from "@/components/admin/paystub/PayrollTable";
import PayrollView from "@/components/admin/paystub/PayrollView";

const EmployeePayslips = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [rows, setRows] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Payroll | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res: any = await fetchPayrolls(dispatch, { page: 1, pageSize: 100 }); // own rows only (server-scoped)
    setRows((res?.result?.data ?? []).map(payrollToRow));
    setIsLoading(false);
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (p: Payroll) => { setSelected(p); setDetailOpen(true); };

  return (
    <div className="border bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] mx-auto shadow-geist-card">
      <div className="flex items-center gap-2 px-6 mb-6">
        <h3 className="text-heading-16 text-g-gray-1000">My Payslips</h3>
        <CountBadge count={rows.length} />
      </div>
      <TanstackTable
        columns={PayrollColumns({
          handleOpenDetailsModal: openDetail,
          showSelection: false,
        })}
        data={rows}
        isLoading={isLoading}
      />
      <CustomModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="" variant="bottom-full" className="h-full">
        {selected && <PayrollView payroll={selected} readOnly />}
      </CustomModal>
    </div>
  );
};

export default EmployeePayslips;
// ponytail: no department/status/period filters on the employee view — an employee has few rows; add filters only if requested. Paging is `pageSize:100` (effectively all of one person's payslips) rather than a pager.
