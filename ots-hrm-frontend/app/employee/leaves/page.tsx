import React from "react";
import LeavesView from "@/components/employee/leaves";

export const generateMetadata = () => ({
  title: "Leaves | SmartHR",
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

export default function LeavesPage() {
  return <LeavesView />;
}
