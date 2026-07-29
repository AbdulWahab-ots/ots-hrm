// app/employee/attendance/page.tsx

import EmployeeRequestTable from "@/components/employee/attendance-request";

export const generateMetadata = () => ({
  title: "Attendance Request | SmartHR",
  description:
    "Track your work hours, check-in/out times, and view attendance history with detailed status reports.",
  keywords: [
    "employee attendance request",
    "time tracking",
    "work hours",
    "attendance history",
    "check-in system",
  ],
});

export default function AttendanceRequestPage() {
  return <EmployeeRequestTable />;
}
