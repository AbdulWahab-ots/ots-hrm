import React from "react";
import AddPerformanceIndicator from "@/components/admin/performance-indicator/add";

export const generateMetadata = () => ({
  title: "Add Indicator | SmartHR",
  description: "Create new performance indicators with technical and organizational metrics for employee evaluation.",
  keywords: [
    "add performance indicator",
    "employee evaluation",
    "performance metrics",
    "HR assessment",
    "performance criteria"
  ]
});

export default function AddPerformanceIndicatorPage() {
  return (
    <AddPerformanceIndicator />
  );
}