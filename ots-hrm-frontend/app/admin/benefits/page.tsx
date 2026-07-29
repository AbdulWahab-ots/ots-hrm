import React from "react";
import LeaveTypes from "@/components/admin/leaves";
import Benefits from "@/components/admin/benefits";

export const generateMetadata = () => ({
  title: "Benifits | SmartHR",
  description:
    "Track and manage employee Benifits with status overview, filtering options, and approval workflows.",
  keywords: [
    "Benifits management",
    "employee leaves",
    "leave tracker",
    "HR system",
    "leave approval",
  ],
});

export default function LeavesPage() {
  return <Benefits />;
}
