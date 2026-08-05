"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { TanstackTable } from "@/components/common/TanstackTable";
import { AppDispatch } from "@/store/store";
import { PayrollColumns } from "@/utils/Columns/PayrollColumns";
import { Payroll, payrollToRow } from "../paystub/PayrollTable";
import Button from "@/components/common/Button";
import { useRouter } from "next/navigation";
import { FiExternalLink } from "react-icons/fi";
import { nowBusiness } from "@/utils/timezone";
import {
  fetchPayrolls as apiFetchPayrolls,
  updatePayrollStatus,
  type PayrollStatus,
} from "@/services/payrollService";

const PendingPayrollTable = () => {
  const [localData, setLocalData] = useState<Payroll[]>([]);
  const [selectedRows, setSelectedRows] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const fetchPayrolls = useCallback(async () => {
    const now = nowBusiness();
    try {
      setIsLoading(true);
      const res: any = await apiFetchPayrolls(dispatch, {
        page: 1,
        pageSize: 5,
        payrollYear: now.getFullYear(),
        payrollMonth: now.getMonth() + 1,
      });
      const rows: Payroll[] = (res?.result?.data ?? []).map(payrollToRow);
      setLocalData(rows.map((p) => ({ ...p, selected: false })));
    } catch (error) {
      console.error("Failed to fetch payrolls:", error);
      setLocalData([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  // Update selected rows
  useEffect(() => {
    setSelectedRows(localData.filter((payroll) => payroll.selected));
  }, [localData]);

  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((payroll) =>
        payroll.id === id
          ? { ...payroll, selected: !payroll.selected }
          : payroll
      )
    );
  };

  const handleStatusChange = async (payroll: Payroll, status: PayrollStatus) => {
    const ok = await updatePayrollStatus(dispatch, { payrollId: payroll.id, status });
    if (ok) fetchPayrolls();
  };

  return (
    <div className="lg:col-span-5 w-full border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto overflow-hidden">
      <div className="px-6 mb-6 flex items-center justify-between">
        <h3 className="text-g-gray-1000 text-heading-16">
          Payroll List
        </h3>
        <div>
          <Button
            label="View all"
            variant="outline"
            icon={FiExternalLink}
            onClick={() => router.push("/admin/paystub")}
          />
        </div>
      </div>
      <div className="relative">
        {localData.length === 0 && !isLoading ? (
          <p className="px-6 text-sm text-g-gray-800">
            No payroll records for this month yet.
          </p>
        ) : (
          <TanstackTable
            columns={PayrollColumns({
              handleOpenDetailsModal: () => router.push("/admin/paystub"),
              handleStatusChange,
              showSelection: false,
            })}
            data={localData}
            className="w-full"
            showCheckboxes={false}
            selectedRows={selectedRows}
            isLoading={isLoading}
            meta={{ toggleRowSelection, selectedRows }}
          />
        )}
      </div>
    </div>
  );
};

export default PendingPayrollTable;
