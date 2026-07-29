// app/employee/layout.tsx
import React from "react";
import EmployeeLayout from "@/components/layouts/EmployeeLayout";

export default function EmployeePagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployeeLayout>{children}</EmployeeLayout>;
}
