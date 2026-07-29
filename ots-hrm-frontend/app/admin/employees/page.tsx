import React from "react";
import EmployeesView from "@/components/admin/employees";

export const generateMetadata = () => ({
  title: "Employees | SmartHR",
  description:
    "Manage your organization's employee directory with comprehensive profiles, status tracking, and filtering capabilities.",
  keywords: [
    "employee directory",
    "staff management",
    "employee status",
    "HR system",
    "employee records",
  ],
});

export default function EmployeesPage() {
  return (
    <EmployeesView />
  );
}
