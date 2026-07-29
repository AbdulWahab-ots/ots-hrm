"use client";

import Button from "@/components/common/Button";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { FiEdit2, FiEye } from "react-icons/fi";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import InputField from "@/components/common/form/InputField";
import { Payroll } from "@/components/admin/paystub/PayrollTable";
import { AppDispatch } from "@/store/store";
import { addAdjustments } from "@/services/payrollService";
import SegmentedTabs from "@/components/common/SegmentedTabs";

const PayrollView = ({
  payroll,
  readOnly = false,
  onChanged,
}: {
  payroll: Payroll;
  // ponytail: read-only (employee payslip) hides the edit tab + add-extra editor.
  readOnly?: boolean;
  // Called after a manual adjustment is saved so the parent can refresh + close.
  onChanged?: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  // Manual-adjustment categories an admin can pick (OTHER = misc).
  // Values must match the backend AdjustmentCategory enum.
  const ADJUSTMENT_CATEGORIES = [
    "BONUS", "ALLOWANCE", "OVERTIME", "BENEFIT", "INSURANCE", "LOAN", "ADVANCE", "OTHER",
  ] as const;
  // State with type annotations
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<"views" | "edit">("views");
  const [showExtraForm, setShowExtraForm] = useState<boolean>(false);
  const [extraType, setExtraType] = useState<"Addition" | "Subtraction">(
    "Addition"
  );
  const [extraCategory, setExtraCategory] = useState<string>("OTHER");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Validation schema for the extra form
  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive")
      .typeError("Amount must be a number"),
  });

  // Toggle between summary and detailed view
  const handleSeeDetails = (): void => {
    setShowDetails(true);
  };

  // Handle filter change (views or edit) with correct type
  const handleFilterChange = (filter: "views" | "edit"): void => {
    setActiveFilter(filter);
  };

  // Handle "Add Other" button click
  const handleAddOther = (): void => {
    setShowExtraForm(true);
  };

  // Persist a manual adjustment to the backend, then ask the parent to refresh.
  // ponytail: closes the modal via onChanged after each save rather than live-patching
  // the in-place totals; reopen to add more. Add in-place refresh only if multi-add UX is asked for.
  const handleExtraSubmit = async (
    values: { name: string; amount: string },
    { resetForm }: FormikHelpers<{ name: string; amount: string }>
  ): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await addAdjustments(dispatch, payroll.id, [
      {
        employeeId: payroll.employee.id,
        adjustmentType: extraType === "Addition" ? "ADDITION" : "DEDUCTION",
        category: extraCategory,
        title: values.name,
        amount: Number(values.amount),
      },
    ]);
    setSubmitting(false);
    if (ok) {
      resetForm();
      setShowExtraForm(false);
      onChanged?.();
    }
  };

  // Handle back button
  const handleBack = (): void => {
    setShowDetails(false);
    setShowExtraForm(false);
  };

  // Format month "YYYY-MM" → "May, 2024"
  const formattedMonth = (() => {
    if (!payroll?.month) return "";
    const [year, month] = payroll.month.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  // Status badge colours
  const statusBadgeClass: Record<string, string> = {
    PENDING: "bg-g-amber-100 text-g-amber-800",
    APPROVED: "bg-g-green-100 text-g-green-800",
    PAID: "bg-g-green-100 text-g-green-800",
    DRAFT: "bg-g-gray-100 text-g-gray-900",
    REJECTED: "bg-g-red-100 text-g-red-800",
    CANCELLED: "bg-g-gray-100 text-g-gray-900",
  };
  const statusClass =
    statusBadgeClass[payroll?.status ?? ""] ?? "bg-g-gray-100 text-g-gray-900";

  // Avatar: use profileUrl if available, otherwise render initials block
  const avatarUrl = payroll?.employee?.profileUrl;
  const initials = (payroll?.employee?.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const AvatarNode = avatarUrl ? (
    <img
      src={avatarUrl}
      alt="Profile"
      className="w-14 h-14 rounded-full object-cover"
    />
  ) : (
    <div className="w-14 h-14 rounded-full bg-g-blue-700 flex items-center justify-center text-white font-semibold text-base select-none">
      {initials}
    </div>
  );

  const AvatarNodeSm = avatarUrl ? (
    <img
      src={avatarUrl}
      alt="Profile"
      className="md:w-14 md:h-14 w-10 h-10 rounded-full object-cover"
    />
  ) : (
    <div className="md:w-14 md:h-14 w-10 h-10 rounded-full bg-g-blue-700 flex items-center justify-center text-white font-semibold text-sm select-none">
      {initials}
    </div>
  );

  return (
    <div id="payslip-print" className="w-full max-w-[928px] mx-auto px-4 overflow-x-hidden">
      {/* First Section: Summary View */}
      {!showDetails && (
        <div className="w-full">
          <p className="text-copy-14 text-(--general-extra-light)">
            Salary Month :{" "}
            <span className="text-(--genrel-text-light) font-semibold">
              {formattedMonth}
            </span>
          </p>
          <div className="bg-g-background-100 flex flex-col sm:flex-row justify-between border-[1px] p-4 my-6 rounded-[var(--g-radius-lg)] border-(--genrel-light-stroke)">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              {AvatarNode}
              <div>
                <div className="font-medium text-(--genrel-text-light) text-base">
                  {payroll?.employee?.name}
                </div>
                <div className="text-sm text-(--genrel-text-light) font-normal">
                  {payroll?.employee?.designation}
                </div>
              </div>
            </div>
            <div>
              <p className="px-2 text-g-gray-900 text-label-14 font-medium py-[2px] bg-g-gray-100 rounded-[var(--g-radius-sm)]">
                {payroll?.department?.name}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-1/2 overflow-hidden rounded-[var(--g-radius-md)] bg-g-background-100 shadow-geist-card">
              <h2 className="p-4 bg-g-gray-100 text-heading-16 text-(--genrel-text-light)">
                Earnings
              </h2>
              <div className="space-y-8 p-6">
                <div className="flex justify-between">
                  <span className="font-medium text-base text-(--general-subtle-light)">
                    Base Salary
                  </span>
                  <span className="text-g-gray-900 font-semibold text-base">
                    PKR {payroll?.baseSalary?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-base text-(--general-subtle-light)">
                    Benefits
                  </span>
                  <span className="text-g-gray-900 font-semibold text-base">
                    PKR {payroll?.benefits?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex p-6 justify-between border-t-[1px] border-(--genrel-light-stroke)">
                <span className="font-medium text-base text-(--general-subtle-light)">
                  Gross Salary
                </span>
                <span className="text-g-gray-900 font-semibold text-base">
                  PKR {payroll?.grossSalary?.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-full lg:w-1/2 overflow-hidden rounded-[var(--g-radius-md)] bg-g-background-100 shadow-geist-card">
              <h2 className="p-4 bg-g-gray-100 text-heading-16 text-(--genrel-text-light)">
                Deductions
              </h2>
              <div className="space-y-8 p-6">
                <div className="flex justify-between">
                  <span className="font-medium text-(--general-subtle-light)">
                    Tax Deducted at Source (T.D.S.)
                  </span>
                  <span className="text-g-gray-900 font-semibold text-base">
                    PKR {payroll?.taxDeductions?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-base text-(--general-subtle-light)">
                    Leaves
                  </span>
                  <span className="text-g-gray-900 font-semibold text-base">
                    PKR {payroll?.leavesDeduction?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex p-6 justify-between border-t-[1px] border-(--genrel-light-stroke)">
                <span className="font-medium text-base text-(--general-subtle-light)">
                  Total Deduction
                </span>
                <span className="font-medium text-base text-g-red-800">
                  -PKR{" "}
                  {(
                    (payroll?.taxDeductions ?? 0) +
                    (payroll?.leavesDeduction ?? 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div
            className="flex justify-center mt-8 gap-2 font-semibold text-(--primary-navy-blue) text-sm cursor-pointer focus-ring-geist"
            onClick={handleSeeDetails}
          >
            <FiEye className="w-5 h-5" /> <span>See Details</span>
          </div>
          <div className="rounded-[var(--g-radius-lg)] mt-14 bg-g-background-100 py-6 px-4 shadow-geist-card">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mx-auto">
              <div>
                <p className="font-medium text-sm text-(--general-subtle-light)">
                  Total Net Salary
                </p>
                <h2 className="text-xl md:text-[30px] text-g-gray-1000 font-bold">
                  PKR {payroll?.netSalary?.toLocaleString()}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-2 print:hidden">
                <Button label="Download" variant="outline" onClick={() => window.print()} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Second Section: Detailed View */}
      {showDetails && (
        <div className="w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <p className="text-2xl sm:text-[30px] text-g-gray-1000 font-bold">
              Salary Breakdown <span className="text-g-gray-alpha-400">.</span>
              <span className="text-(--genrel-text-light) text-sm font-semibold block sm:inline-block mt-1 sm:mt-0 sm:ml-2">
                {formattedMonth}
              </span>
            </p>
            <SegmentedTabs
              className="self-start"
              options={(readOnly
                ? [{ value: "views" as const, label: <FiEye className="w-5 h-5" /> }]
                : [
                    { value: "views" as const, label: <FiEye className="w-5 h-5" /> },
                    { value: "edit" as const, label: <FiEdit2 className="w-5 h-5" /> },
                  ]
              )}
              value={activeFilter}
              onChange={handleFilterChange}
            />
          </div>
          <div className="bg-g-background-100 flex flex-col sm:flex-row justify-between border-[1px] p-4 my-6 rounded-[var(--g-radius-lg)] border-(--genrel-light-stroke)">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              {AvatarNodeSm}
              <div>
                <div className="font-medium text-(--genrel-text-light) text-base">
                  {payroll?.employee?.name}
                </div>
                <div className="text-sm text-(--genrel-text-light) font-normal">
                  {payroll?.employee?.designation}
                </div>
              </div>
            </div>
            <div>
              <p className="px-2 text-g-gray-900 text-label-14 font-medium py-[2px] bg-g-gray-100 rounded-[var(--g-radius-sm)]">
                {payroll?.department?.name}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-col flex gap-4 w-full lg:w-1/2">
              <div className="overflow-hidden border-[1px] border-(--genrel-light-stroke) rounded-[var(--g-radius-md)] bg-g-background-100">
                <h2 className="p-4 bg-g-gray-100 text-heading-16 text-(--genrel-text-light)">
                  Earnings
                </h2>
                <div className="space-y-8 p-6">
                  <div className="flex justify-between">
                    <span className="font-medium text-base text-(--general-subtle-light)">
                      Base Salary
                    </span>
                    <span className="text-(--general-extra-light) px-3 py-2 rounded-[var(--g-radius-sm)] border-[1px] bg-g-gray-alpha-100 border-(--genrel-light-stroke) font-semibold text-base">
                      PKR {payroll?.baseSalary?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-base text-(--general-subtle-light)">
                      Benefits
                    </span>
                    <span className="text-(--general-extra-light) px-3 py-2 rounded-[var(--g-radius-sm)] border-[1px] bg-g-gray-alpha-100 border-(--genrel-light-stroke) font-semibold text-base">
                      PKR {payroll?.benefits?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-[var(--g-radius-md)] border-[1px] border-(--genrel-light-stroke) bg-g-background-100">
                <h2 className="p-4 bg-g-gray-100 text-heading-16 text-(--genrel-text-light)">
                  Deductions
                </h2>
                <div className="space-y-8 p-6">
                  <div className="flex justify-between">
                    <span className="font-medium text-base text-(--general-subtle-light)">
                      Tax Deducted at Source (T.D.S.)
                    </span>
                    <span className="text-(--general-extra-light) px-3 py-2 rounded-[var(--g-radius-sm)] border-[1px] bg-g-gray-alpha-100 border-(--genrel-light-stroke) font-semibold text-base">
                      PKR {payroll?.taxDeductions?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-base text-(--general-subtle-light)">
                      Leaves
                    </span>
                    <span className="text-(--general-extra-light) px-3 py-2 rounded-[var(--g-radius-sm)] border-[1px] bg-g-gray-alpha-100 border-(--genrel-light-stroke) font-semibold text-base">
                      PKR {payroll?.leavesDeduction?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {!readOnly && payroll?.status === "DRAFT" && (
              <div className="overflow-hidden border-[1px] border-(--genrel-light-stroke) rounded-[var(--g-radius-md)] bg-g-background-100 mt-4">
                <h2 className="p-4 bg-g-gray-100 text-heading-16 text-(--genrel-text-light)">
                  Extra
                </h2>
                <div className="space-y-4">
                  {showExtraForm && (
                    <div className="">
                      <Formik
                        initialValues={{ name: "", amount: "" }}
                        validationSchema={validationSchema}
                        onSubmit={handleExtraSubmit}
                      >
                        {() => (
                          <Form className="p-4">
                            <SegmentedTabs
                              className="mb-4 w-fit"
                              options={[
                                { value: "Addition" as const, label: "Addition" },
                                { value: "Subtraction" as const, label: "Subtraction" },
                              ]}
                              value={extraType}
                              onChange={setExtraType}
                            />
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-g-gray-900 mb-1">
                                Category
                              </label>
                              <select
                                value={extraCategory}
                                onChange={(e) => setExtraCategory(e.target.value)}
                                className="w-full border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] px-3 py-2 text-sm focus-ring-geist"
                              >
                                {ADJUSTMENT_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c.charAt(0) + c.slice(1).toLowerCase()}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <InputField
                                  label="Name"
                                  name="name"
                                  type="text"
                                  placeholder="Enter name"
                                />
                              </div>
                              <div className="flex-1">
                                <InputField
                                  label="Amount"
                                  name="amount"
                                  type="number"
                                  placeholder="Enter amount"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Button
                                type="submit"
                                label={submitting ? "Adding..." : "Add"}
                                variant="filled"
                                disabled={submitting}
                              />
                            </div>
                          </Form>
                        )}
                      </Formik>
                    </div>
                  )}
                </div>
                {!showExtraForm && (
                  <div className="p-4">
                    <button
                      className="text-(--primary-navy-blue) cursor-pointer focus-ring-geist"
                      onClick={handleAddOther}
                    >
                      + Add Other
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
            <div className="w-full lg:w-1/2">
              <div className="overflow-hidden rounded-[var(--g-radius-md)] bg-g-background-100 border-[1px] border-(--genrel-light-stroke)">
                <div className="p-4 flex justify-between">
                  <h2 className="text-heading-16 text-(--genrel-text-light)">
                    Salary Summary
                  </h2>
                  <div>
                    <span
                      className={`px-2 py-[2px] rounded-[var(--g-radius-sm)] text-xs font-normal ${statusClass}`}
                    >
                      {payroll?.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-8 p-6">
                  <div className="flex justify-between">
                    <span className="font-medium text-lg text-(--general-subtle-light)">
                      Base Salary
                    </span>
                    <span className="font-semibold text-lg text-g-gray-900">
                      +PKR {payroll?.baseSalary?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-lg text-(--general-subtle-light)">
                      Benefits
                    </span>
                    <span className="font-semibold text-lg text-g-gray-900">
                      +PKR {payroll?.benefits?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b-[1px] pb-4 border-(--genrel-light-stroke)">
                    <span className="font-medium text-lg text-(--general-subtle-light)">
                      Gross Salary
                    </span>
                    <span className="font-semibold text-lg text-g-gray-900">
                      +PKR {payroll?.grossSalary?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-lg text-(--general-subtle-light)">
                      Tax Deductions
                    </span>
                    <span className="font-semibold text-lg text-g-red-800">
                      -PKR {payroll?.taxDeductions?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-lg text-(--general-subtle-light)">
                      Leaves Deduction
                    </span>
                    <span className="font-semibold text-lg text-g-red-800">
                      -PKR {payroll?.leavesDeduction?.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="py-4 mx-4 border-t-[1px] border-(--genrel-light-stroke)">
                  <p className="font-semibold text-base text-g-gray-900">
                    Total Net Salary
                  </p>
                  <h2 className="text-[30px] text-g-gray-1000 pb-6 font-bold">
                    PKR {payroll?.netSalary?.toFixed(2)}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--g-radius-lg)] mt-10 mb-6 bg-g-background-100 py-6 px-4 shadow-geist-card">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mx-auto">
              <button
                type="button"
                className="text-(--primary-navy-blue) cursor-pointer hover:underline self-start sm:self-center focus-ring-geist"
                onClick={handleBack}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollView;
