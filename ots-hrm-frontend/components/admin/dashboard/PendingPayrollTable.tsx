"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { TanstackTable } from "@/components/common/TanstackTable";
import { AppDispatch } from "@/store/store";
import { PayrollColumns } from "../../../utils/Columns/PandingPayroll";
import Button from "@/components/common/Button";
import { GrShare } from "react-icons/gr";
import { useRouter } from "next/navigation";
import { FiExternalLink } from "react-icons/fi";

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
  month: string;
  date: string;
  grossSalary: number;
  baseSalary: number;
  benefits: number;
  taxDeductions: number;
  leavesDeduction: number;
  status: "Paid" | "Pending" | "Action Required";
}

const PendingPayrollTable = () => {
  const [localData, setLocalData] = useState<Payroll[]>([]);
  const [selectedRows, setSelectedRows] = useState<Payroll[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Dummy data
  const dummyData: Payroll[] = [
    {
      id: "1",
      employee: {
        id: "EMP001",
        name: "John Doe",
        designation: "Software Engineer",
      },
      department: { id: "dept1", name: "Engineering" },
      month: "2025-08",
      date: "2025-08-15",
      grossSalary: 5000,
      baseSalary: 4000,
      benefits: 500,
      taxDeductions: 400,
      leavesDeduction: 100,
      status: "Paid",
    },
    {
      id: "2",
      employee: { id: "EMP002", name: "Jane Smith", designation: "Designer" },
      department: { id: "dept2", name: "Design" },
      month: "2025-07",
      date: "2025-07-10",
      grossSalary: 4500,
      baseSalary: 3500,
      benefits: 600,
      taxDeductions: 350,
      leavesDeduction: 50,
      status: "Pending",
    },
    {
      id: "3",
      employee: { id: "EMP003", name: "Bob Johnson", designation: "Manager" },
      department: { id: "dept3", name: "Management" },
      month: "2025-06",
      date: "2025-06-20",
      grossSalary: 6000,
      baseSalary: 5000,
      benefits: 700,
      taxDeductions: 500,
      leavesDeduction: 200,
      status: "Action Required",
    },
  ];

  // Initialize data
  useEffect(() => {
    setLocalData(dummyData.map((payroll) => ({ ...payroll, selected: false })));
  }, []);

  // Update selected rows
  useEffect(() => {
    setSelectedRows(localData.filter((payroll) => payroll.selected));
  }, [localData]);

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

  /**
   * Updates payroll status.
   * @param payroll - Payroll to update
   * @param status - New status
   */
  const handleStatusChange = (
    payroll: Payroll,
    status: "Paid" | "Pending" | "Action Required"
  ) => {
    setLocalData((prevData) =>
      prevData.map((p) => (p.id === payroll.id ? { ...p, status } : p))
    );
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
        <TanstackTable
          columns={PayrollColumns({ handleStatusChange, showCheckbox: false })}
          data={localData}
          className="w-full"
          showCheckboxes={false}
          selectedRows={selectedRows}
          isLoading={false}
          meta={{ toggleRowSelection, selectedRows }}
        />
      </div>
    </div>
  );
};

export default PendingPayrollTable;
