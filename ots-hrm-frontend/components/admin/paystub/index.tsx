"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import PayrollOverview from "./overviews/PayrollOverview";
import PaymentStatusChart from "./overviews/PaymentStatusChart";
import PayrollTable, { payrollToRow, type Payroll } from "./PayrollTable";
import { fetchPayrolls } from "@/services/payrollService";

const PayStubPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [rows, setRows] = useState<Payroll[]>([]);

  // Load the whole company's payroll once to drive the overview widgets.
  // ponytail: pageSize 1000 covers typical tenants; move to a server-side
  // aggregate endpoint if payroll volume outgrows a single page.
  const loadStats = useCallback(async () => {
    const res: any = await fetchPayrolls(dispatch, { page: 1, pageSize: 1000 });
    setRows((res?.result?.data ?? []).map(payrollToRow));
  }, [dispatch]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalNet = rows.reduce((sum, r) => sum + (r.netSalary || 0), 0);

  const deptTotals: Record<string, number> = {};
  rows.forEach((r) => {
    const name = r.department?.name || "—";
    deptTotals[name] = (deptTotals[name] || 0) + (r.netSalary || 0);
  });

  const statusCounts: Record<string, number> = {};
  rows.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        <PayrollOverview
          totalNet={totalNet}
          departmentLabels={Object.keys(deptTotals)}
          departmentTotals={Object.values(deptTotals)}
        />
        <PaymentStatusChart statusCounts={statusCounts} />
      </div>
      <PayrollTable />
    </>
  );
};

export default PayStubPage;
