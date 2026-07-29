"use client";

import EmployeeByDepartment from "./EmployeeByDepartment";
import AttendanceSummary from "./AttendanceSummary";
import WorkingFormat from "../../common/WorkingFormat";
import DashboardCards from "./DahboardCards";
import LeaveDashboard from "./LeaveDashboard";
import PendingPayrollTable from "./PendingPayrollTable";
import PayrollStatus from "./PayrollStatus";

export default function DashboardView() {
  return (
    <div className="space-y-6 ">
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
        <DashboardCards />
        <EmployeeByDepartment />
      </div>
      <div className=" grid xl:grid-cols-10 gap-6">
        <AttendanceSummary />
        <WorkingFormat />
        <LeaveDashboard />
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <PendingPayrollTable />
        <PayrollStatus />
      </div>
    </div>
  );
}
