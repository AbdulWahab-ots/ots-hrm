import React from "react";
import PerformanceIndicatorPage from "@/components/admin/performance-indicator";

export const generateMetadata = () => ({
  title: "Performance Indicators | SmartHR",
  description: "Track and manage employee performance metrics with indicators, sorting, and status monitoring.",
  keywords: [
    "performance indicators",
    "employee performance",
    "performance metrics",
    "HR analytics",
    "performance tracking"
  ]
});

export default function PerformanceIndicatorMainPage() {
  return (
    <PerformanceIndicatorPage />
  );
}