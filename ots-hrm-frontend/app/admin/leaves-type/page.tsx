import LeaveTypes from "@/components/admin/leaves-type";
import React from "react";

export const generateMetadata = () => ({
  title: "Leaves Type | SmartHR",
  description:
    "Track and manage employee leaves with status overview, filtering options, and approval workflows.",
  keywords: [
    "leave management",
    "employee leaves",
    "leave tracker",
    "HR system",
    "leave approval",
  ],
});

export default function LeavesTypesPage() {
  return <LeaveTypes />;
}
