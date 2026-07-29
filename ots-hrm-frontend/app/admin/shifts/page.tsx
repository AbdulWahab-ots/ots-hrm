import Shifts from "@/components/admin/shifts";
import React from "react";
export const generateMetadata = () => ({
  title: "Shifts | SmartHR",
  description:
    "Track and manage employee performance metrics with indicators, sorting, and status monitoring.",
  keywords: [
    "performance indicators",
    "employee performance",
    "performance metrics",
    "HR analytics",
    "performance tracking",
  ],
});
const page = () => {
  return <Shifts />;
};

export default page;
