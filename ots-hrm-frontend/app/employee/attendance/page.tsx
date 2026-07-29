// app/employee/attendance/page.tsx
import EmployeeAttendance from "@/components/employee/attendance";

export const generateMetadata = () => ({
  title: "Attendance | SmartHR",
  description:
    "Track your work hours, check-in/out times, and view attendance history with detailed status reports.",
  keywords: [
    "employee attendance",
    "time tracking",
    "work hours",
    "attendance history",
    "check-in system",
  ],
});

export default function AttendancePage() {
  return <EmployeeAttendance />;
}
