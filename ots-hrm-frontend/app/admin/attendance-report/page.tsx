import React from "react";

import AttendanceManagement from "@/components/admin/attendance-report";

export const generateMetadata = () => ({
  title: "Attendance | SmartHR",
  description:
    "Track employee attendance with detailed reports, check-in/out times, and status overview.",
  keywords: [
    "attendance report",
    "employee attendance",
    "time tracking",
    "HR system",
    "work hours",
  ],
});

export default function AttendanceReportPage() {
  return <AttendanceManagement />;
}
