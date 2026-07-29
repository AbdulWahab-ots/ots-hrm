import Leaves from "@/components/admin/leaves";
import React from "react";
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
const LeavesPage = () => {
  return <Leaves />;
};

export default LeavesPage;
