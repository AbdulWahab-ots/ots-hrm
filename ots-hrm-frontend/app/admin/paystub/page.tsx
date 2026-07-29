import PayStubPage from "@/components/admin/paystub";
import React from "react";

export const generateMetadata = () => ({
  title: "Employee Salary | SmartHR",
  description:
    "View and manage employee salary records with date range filtering, designation sorting, and export capabilities.",
  keywords: [
    "employee salary",
    "salary management",
    "payroll records",
    "salary processing",
    "compensation data",
  ],
});
const page = () => {
  return <PayStubPage />;
};

export default page;
