"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowUpToLine } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Button from "@/components/common/Button";
import CustomModal from "@/components/common/CustomModal";
import CustomDropdown from "@/components/common/form/DropDown";
import CustomCheckbox from "@/components/common/form/CustomCheckbox";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { TanstackTable } from "@/components/common/TanstackTable";
import { AppDispatch, RootState } from "@/store/store";
import { fetchAllDepartments } from "@/services/adminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { PayrollColumns } from "@/utils/Columns/PayrollColumns";
import PayrollView from "./PayrollView";
import CountBadge from "@/components/common/CountBadge";
import { nowBusiness } from "@/utils/timezone";
import {
  fetchPayrolls as apiFetchPayrolls,
  updatePayrollStatus,
  deletePayroll,
  generateSalarySlips,
  type PayrollStatus,
} from "@/services/payrollService";

// Interfaces
export interface Employee {
  id: string;
  name: string;
  designation: string;
  profileUrl?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Payroll {
  id: string;
  selected?: boolean;
  employee: Employee;
  department: Department;
  month: string;          // "YYYY-MM"
  date: string;           // approvedAt date or ""
  grossSalary: number;
  baseSalary: number;
  benefits: number;       // totalAdditions
  taxDeductions: number;  // incomeTax
  leavesDeduction: number;// non-tax deductions
  netSalary: number;
  status: PayrollStatus;
}

// Map a backend IPayrollResponse to the table row shape.
export function payrollToRow(p: any): Payroll {
  const u = p.user ?? p.employee?.user;
  const name = u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "—";
  const incomeTax = Number(p.incomeTax ?? 0);
  const totalDeductions = Number(p.totalDeductions ?? 0);
  return {
    id: p.id,
    employee: {
      id: p.employeeId ?? "",
      name: name || "—",
      designation: p.employee?.employeeCode ?? "", // ponytail: employeeCode in the designation slot; join the designation relation server-side only if the product needs the title here.
    },
    department: { id: p.departmentId ?? "", name: p.department?.name ?? "—" },
    month: `${p.payrollYear}-${String(p.payrollMonth).padStart(2, "0")}`,
    // format() reads the local calendar date, so an approval timestamp near
    // midnight displays on the day the approver actually saw, not its UTC date.
    date: p.approvedAt ? format(new Date(p.approvedAt), "yyyy-MM-dd") : "",
    grossSalary: Number(p.grossSalary ?? 0),
    baseSalary: Number(p.basicSalary ?? 0),
    benefits: Number(p.totalAdditions ?? 0),
    taxDeductions: incomeTax,
    leavesDeduction: Math.max(0, totalDeductions - incomeTax),
    netSalary: Number(p.netSalary ?? 0),
    status: (p.status ?? "DRAFT") as PayrollStatus,
  };
}

const PayrollTable = () => {
  // State
  const [localData, setLocalData] = useState<Payroll[]>([]);
  const [selectedRows, setSelectedRows] = useState<Payroll[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "Recent" | "Last Month" | "Quarterly" | "Yearly"
  >("Recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Generate salary slips form state
  const [generateDepartmentIds, setGenerateDepartmentIds] = useState<string[]>([]);
  const [generateMonth, setGenerateMonth] = useState<string>("");
  const [generateYear, setGenerateYear] = useState<string>("");
  const [generateNotes, setGenerateNotes] = useState<string>("");

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Select departments from Redux store
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const departmentOptions = [
    { value: "", label: "All Departments" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  // ponytail: real 6-value status options replace the former 3-value mock list
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Initialize departments
  useEffect(() => {
    if (!hasInitialized && (!departments || departments.length === 0)) {
      dispatch(fetchAllDepartments);
      setHasInitialized(true);
    }
  }, [dispatch, departments, hasInitialized]);

  const periodFilter = useCallback(() => {
    const now = nowBusiness();
    const y = now.getFullYear();
    const m = now.getMonth() + 1; // 1-12
    if (activeFilter === "Recent") return { payrollYear: y, payrollMonth: m };
    if (activeFilter === "Last Month")
      return m === 1
        ? { payrollYear: y - 1, payrollMonth: 12 }
        : { payrollYear: y, payrollMonth: m - 1 };
    if (activeFilter === "Quarterly") {
      const q = Math.floor((m - 1) / 3); // 0-3
      return {
        payrollYear: y,
        payrollMonthStart: q * 3 + 1,
        payrollMonthEnd: q * 3 + 3,
      };
    }
    // Yearly: whole year
    return { payrollYear: y };
  }, [activeFilter]);

  /**
   * Fetches payroll data from the backend API based on active filter, department, and status.
   * @param page - Current page number
   */
  const fetchPayrolls = useCallback(
    async (page: number) => {
      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const res: any = await apiFetchPayrolls(dispatch, {
          page,
          pageSize: 10,
          departmentId: selectedDepartment || undefined,
          status: (selectedStatus || undefined) as PayrollStatus | undefined,
          ...periodFilter(),
        });
        const rows: Payroll[] = (res?.result?.data ?? []).map(payrollToRow);

        setLocalData(rows.map((p) => ({ ...p, selected: false })));
        setTotalItems(res?.result?.total ?? rows.length);
        setTotalPages(res?.result?.numberOfPages ?? 1);
      } catch (error) {
        console.error("Failed to fetch payrolls:", error);
        setLocalData([]);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch, selectedDepartment, selectedStatus, activeFilter, periodFilter]
  );

  // Fetch data when filters or page change
  useEffect(() => {
    if (hasInitialized) {
      fetchPayrolls(currentPage);
    }
  }, [
    currentPage,
    selectedDepartment,
    selectedStatus,
    activeFilter,
    fetchPayrolls,
    hasInitialized,
  ]);

  /**
   * Toggles row selection for table checkboxes.
   * @param id - Payroll ID
   */
  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((payroll) =>
        payroll.id === id
          ? { ...payroll, selected: !payroll.selected }
          : payroll
      )
    );
  };

  // Update selected rows
  useEffect(() => {
    setSelectedRows(localData.filter((payroll) => payroll.selected));
  }, [localData]);

  /**
   * Opens details modal for a payroll.
   * @param payroll - Payroll to view
   */
  const handleOpenDetailsModal = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailsModalOpen(true);
  };

  /**
   * Closes details modal.
   */
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPayroll(null);
  };

  /**
   * Updates payroll status via the API then refreshes the list.
   * @param payroll - Payroll to update
   * @param status - New status
   */
  const handleStatusChange = async (payroll: Payroll, status: PayrollStatus) => {
    const ok = await updatePayrollStatus(dispatch, { payrollId: payroll.id, status });
    if (ok) fetchPayrolls(currentPage);
  };

  /**
   * Deletes a payroll via the API then refreshes the list.
   * @param payroll - Payroll to delete
   */
  const handleDelete = async (payroll: Payroll) => {
    if (!window.confirm(`Delete payroll for ${payroll.employee.name} (${payroll.month})? This cannot be undone.`)) return;
    const ok = await deletePayroll(dispatch, payroll.id);
    if (ok) fetchPayrolls(currentPage);
  };

  /**
   * Opens the generate salary slips modal.
   * ponytail: dropped the old free-text create form; payroll rows are generated from
   * department + month/year, not hand-typed. Modal now collects departments, month, year, notes.
   */
  const handleOpenGenerateModal = () => {
    dispatch(fetchAllDepartments);
    setGenerateDepartmentIds([]);
    setGenerateMonth("");
    setGenerateYear("");
    setGenerateNotes("");
    setIsModalOpen(true);
  };

  /**
   * Submits the generate salary slips request.
   */
  const handleGenerate = async () => {
    const month = parseInt(generateMonth, 10);
    const year = parseInt(generateYear, 10);
    if (!generateDepartmentIds.length || !month || !year) return;

    setIsGenerating(true);
    try {
      const ok = await generateSalarySlips(dispatch, {
        departmentIds: generateDepartmentIds,
        payrollMonth: month,
        payrollYear: year,
        notes: generateNotes || undefined,
      });
      if (ok) {
        setIsModalOpen(false);
        setSuccessMessage("Salary slips generated.");
        setIsSuccessModalOpen(true);
        fetchPayrolls(currentPage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handles filter tab change.
   * @param filter - Selected filter tab
   */
  const handleFilterChange = (
    filter: "Recent" | "Last Month" | "Quarterly" | "Yearly"
  ) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // ponytail: custom date-range picker hidden; month/year tabs cover the real need.
  // The selectedRange / DateRangeField / DateRangePickerModal UI is removed.

  // Manage body scroll for modals
  useEffect(() => {
    document.body.style.overflow =
      isModalOpen || isDetailsModalOpen || isSuccessModalOpen
        ? "hidden"
        : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isDetailsModalOpen, isSuccessModalOpen]);

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="flex gap-4 font-semibold my-6">
          <button
            onClick={() => handleFilterChange("Recent")}
            className={`md:px-6 md:py-4 px-3 py-2 text-base cursor-pointer rounded-[var(--g-radius-md)] focus-ring-geist ${activeFilter === "Recent"
              ? "bg-g-background-100 text-[var(--primary-dark-gray)] border-[1px] border-[var(--genrel-light-stroke)]"
              : "text-[var(--general-extra-light)]"
              }`}
          >
            Recent
          </button>
          <button
            onClick={() => handleFilterChange("Last Month")}
            className={`md:px-6 md:py-4 px-3 py-2 text-base cursor-pointer rounded-[var(--g-radius-md)] focus-ring-geist ${activeFilter === "Last Month"
              ? "bg-g-background-100 text-[var(--primary-dark-gray)] border-[1px] border-[var(--genrel-light-stroke)]"
              : "text-[var(--general-extra-light)]"
              }`}
          >
            Last Month
          </button>
          <button
            onClick={() => handleFilterChange("Quarterly")}
            className={`md:px-6 md:py-4 px-3 py-2 text-base cursor-pointer rounded-[var(--g-radius-md)] focus-ring-geist ${activeFilter === "Quarterly"
              ? "bg-g-background-100 text-[var(--primary-dark-gray)] border-[1px] border-[var(--genrel-light-stroke)]"
              : "text-[var(--general-extra-light)]"
              }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => handleFilterChange("Yearly")}
            className={`md:px-6 md:py-4 px-3 py-2 text-base cursor-pointer rounded-[var(--g-radius-md)] focus-ring-geist ${activeFilter === "Yearly"
              ? "bg-g-background-100 text-[var(--primary-dark-gray)] border-[1px] border-[var(--genrel-light-stroke)]"
              : "text-[var(--general-extra-light)]"
              }`}
          >
            Yearly
          </button>
        </h2>
        <div className="flex gap-4">
          {/* ponytail: relabeled from "Export All" to "Generate Salary Slips" */}
          <Button
            icon={ArrowUpToLine}
            variant="outline"
            label="Generate Salary Slips"
            onClick={handleOpenGenerateModal}
          />
        </div>
      </div>
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] mx-auto shadow-geist-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-[var(--primary-gray-900)]">
              Payroll List
            </h3>
            <CountBadge count={totalItems} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex gap-2">
              <CustomDropdown
                id="department-filter"
                name="department"
                options={departmentOptions}
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                placeholder="Department"
              />
              <CustomDropdown
                id="status-filter"
                name="status"
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                placeholder="Status"
              />
            </div>
          </div>
        </div>

        <div className="relative">
          <TanstackTable
            columns={PayrollColumns({
              handleOpenDetailsModal,
              handleStatusChange,
              handleDelete,
            })}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            meta={{ toggleRowSelection, selectedRows, router }}
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-between px-6 sm:items-center border-t border-g-gray-alpha-400 pt-4">
            <div className="flex gap-4">
              <Button
                label="Previous"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              />
              <Button
                label="Next"
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages || isLoading}
              />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex justify-center items-center text-sm rounded-[var(--g-radius-full)] font-medium focus-ring-geist ${currentPage === page
                      ? "bg-g-blue-100 border-g-blue-400 border-[1px] text-g-blue-700"
                      : "bg-g-gray-100 text-g-gray-800 hover:bg-g-gray-200"
                      }`}
                    disabled={isLoading}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      </div>

      {/* Generate Salary Slips Modal */}
      {/* ponytail: minimal generate form — departments multiselect (checkboxes), month number, year number, optional notes */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Salary Slips"
        variant="default"
        className="!h-auto max-h-[85vh]"
      >
        <div className="flex flex-col gap-4 p-6 min-w-[360px]">
          <div>
            <label className="text-g-gray-900 text-label-14 font-medium block mb-1">
              Departments
            </label>
            <div className="border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] p-4 max-h-48 overflow-y-auto space-y-2">
              {departments?.map((dept: Department) => (
                <label
                  key={dept.id}
                  className="flex items-center gap-2 cursor-pointer text-label-14 text-g-gray-900"
                >
                  <CustomCheckbox
                    id={`generate-dept-${dept.id}`}
                    checked={generateDepartmentIds.includes(dept.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setGenerateDepartmentIds((prev) => [...prev, dept.id]);
                      } else {
                        setGenerateDepartmentIds((prev) =>
                          prev.filter((id) => id !== dept.id)
                        );
                      }
                    }}
                  />
                  {dept.name}
                </label>
              ))}
              {(!departments || departments.length === 0) && (
                <p className="text-g-gray-800 text-copy-14">No departments loaded.</p>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-g-gray-900 text-label-14 font-medium block mb-1">
                Month (1–12)
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                placeholder="e.g. 6"
                className="block w-full h-10 px-3 text-label-14 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-g-gray-900 text-label-14 font-medium block mb-1">
                Year
              </label>
              <input
                type="number"
                min={2020}
                max={2100}
                value={generateYear}
                onChange={(e) => setGenerateYear(e.target.value)}
                placeholder="e.g. 2025"
                className="block w-full h-10 px-3 text-label-14 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div>
            <label className="text-g-gray-900 text-label-14 font-medium block mb-1">
              Notes (optional)
            </label>
            <textarea
              value={generateNotes}
              onChange={(e) => setGenerateNotes(e.target.value)}
              placeholder="Optional notes..."
              className="block w-full px-3 py-2 text-label-14 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] resize-none focus:outline-none focus-ring-geist transition-all duration-200"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              label="Cancel"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isGenerating}
            />
            <Button
              label="Generate"
              variant="filled"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={
                !generateDepartmentIds.length ||
                !generateMonth ||
                !generateYear ||
                isGenerating
              }
            />
          </div>
        </div>
      </CustomModal>

      <CustomModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title=""
        variant="bottom-full"
        className="h-full"
      >
        {selectedPayroll && (
          <PayrollView
            payroll={selectedPayroll}
            onChanged={() => {
              handleCloseDetailsModal();
              fetchPayrolls(currentPage);
            }}
          />
        )}
      </CustomModal>

      <SuccessConfirmation
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success!"
        message={successMessage}
      />
    </>
  );
};

export default PayrollTable;
