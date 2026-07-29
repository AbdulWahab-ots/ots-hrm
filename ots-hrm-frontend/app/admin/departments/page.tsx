import React from "react";
import Departments from "@/components/admin/departments";

export const generateMetadata = () => ({
  title: "Department | SmartHR",
  description: "View and manage company departments with the ability to add new department entries to the calendar.",
  keywords: [
    "department management",
    "company departments"
  ]
});

export default function DepartmentsPage() {
  return (
    <Departments />
  );
}