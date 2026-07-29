import DesignationTable from "@/components/admin/designations";
import React from "react";
// import Designations from "@/components/admin/designations";

export const generateMetadata = () => ({
  title: "Designations | SmartHR",
  description:
    "View and manage company designations with the ability to add, edit, and track employee positions across departments.",
  keywords: [
    "designation management",
    "employee positions",
    "job titles",
    "company structure",
    "organization hierarchy",
  ],
});

export default function DesignationsPage() {
  return (
    // <Designations />
    <DesignationTable />
  );
}
